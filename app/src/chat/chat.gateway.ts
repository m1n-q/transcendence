import { Logger, UseFilters } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Socket, Server, BroadcastOperator } from 'socket.io';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConsumeMessage } from 'amqplib';
import { RmqEvent } from '../common/rmq/types/rmq-event';
import { AuthService } from '../auth/auth.service';
import { RedisService } from '../redis-module/services/redis.service';
import { UserInfo } from '../auth/dto/user-info.dto';
import { WsExceptionsFilter } from '../common/ws/ws-exceptions.filter';
import { v4 } from 'uuid';
import { ChatService } from './services/chat.service';
import { MessageType } from './dto/chat-room-message.dto';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import {
  EventCommand,
  CommandFactory,
  RoutingKeyParams,
} from './types/chat-event-command';
import {
  ChatAnnouncementFromServer,
  ChatMessageFormat,
  ChatMessageFromClient,
  ChatMessageFromServer,
} from './types/chat-message-format';

@UseFilters(new WsExceptionsFilter())
@WebSocketGateway(9999, { cors: true })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;
  private serverId: string;
  private logger = new Logger('ChatGateway');

  constructor(
    private readonly authService: AuthService,
    private readonly amqpConnection: AmqpConnection,
    private readonly redisService: RedisService,
    private readonly chatService: ChatService,
    private readonly commandFactory: CommandFactory,
  ) {
    /* gen UUID to distinguish same roomId queue at other WS */
    this.serverId = v4();
  }

  //@======================================================================@//
  //@                             Connection                               @//
  //@======================================================================@//

  async afterInit(server: Server) {
    /* when last user of chat-room on this ws-instance exit, delete room-queue */
    server.of('/').adapter.on('delete-room', async (room) => {
      try {
        await this.amqpConnection.channel.deleteQueue(this.roomQ(room));
      } catch (e) {
        console.log(`Failed to delete ${this.roomQ(room)}`);
      }
    });
  }

  async handleConnection(
    @ConnectedSocket() clientSocket: Socket,
    ...args: any[]
  ) {
    let user: UserInfo;
    try {
      user = await this.bindUser(clientSocket);
    } catch (e) {
      clientSocket.disconnect(true);
      return;
    }
    /* map connected socket ID with user ID */
    await this.setConnSocketId(user.user_id, clientSocket.id);
  }

  async handleDisconnect(@ConnectedSocket() clientSocket: Socket) {
    const user: UserInfo = this.getUser(clientSocket);

    if (!user) {
      clientSocket.disconnect(true);
      return;
    }
    await this.redisService.hdel(this.makeUserKey(user.user_id), 'chat_sock');
  }

  //*======================================================================*//
  //*                         socket.io message emitter                    *//
  //*======================================================================*//

  send(
    evName: string,
    socket: Socket | BroadcastOperator<DefaultEventsMap, null>,
    payload: ChatMessageFormat,
  ) {
    socket.emit(evName, payload);
  }

  announce(
    socket: Socket | BroadcastOperator<DefaultEventsMap, null>,
    payload: ChatAnnouncementFromServer,
  ) {
    socket.emit('announcement', payload);
  }

  sendMessage(
    socket: Socket | BroadcastOperator<DefaultEventsMap, null>,
    payload: ChatMessageFromServer,
  ) {
    socket.emit('subscribe', payload);
  }
  echoMessage(
    socket: Socket | BroadcastOperator<DefaultEventsMap, null>,
    payload: ChatMessageFromServer,
  ) {
    socket.emit('subscribe_self', payload);
  }

  //*======================================================================*//
  //*                        socket.io message handler                     *//
  //*======================================================================*//

  @SubscribeMessage('join')
  async joinRoom(
    @MessageBody() message,
    @ConnectedSocket() clientSocket: Socket,
  ) {
    const room = message.room;
    await clientSocket.join(room);

    /* topic per room */
    await this.amqpConnection.channel.assertExchange(
      this.roomTX(room),
      'topic',
      {
        autoDelete: true,
      },
    );

    /* queue per room-event */
    const roomQueue = await this.amqpConnection.channel.assertQueue(
      this.roomQ(room),
      {
        autoDelete: true /* delete if no handler */,
      },
    );
    /* only one consumer(handler) per room */
    if (!roomQueue.consumerCount) {
      await this.amqpConnection.createSubscriber(
        (msg: RmqEvent, rawMsg) => this.chatRoomEventHandler(msg, rawMsg), // to bind "this", need arrow function
        {
          exchange: this.roomTX(room),
          queue: this.roomQ(room) /* subscriber */,
          routingKey: [
            this.roomRK('message', room),
            this.roomRK('announcement', room),
            this.roomRK('ban', room),
          ],
          errorHandler: (c, m, e) => this.logger.error(e),
          queueOptions: {
            autoDelete: true,
          },
        },
        'chatRoomEventHandler',
      );
    }
  }

  @SubscribeMessage('publish')
  async publish(
    @MessageBody() message: ChatMessageFromClient,
    @ConnectedSocket() clientSocket: Socket,
  ) {
    const sender = this.getUser(clientSocket);

    /* To Database */
    const toStore: MessageType = {
      sender_id: sender.user_id,
      payload: message.payload,
      created: null,
    };

    /* NOTE: sync or async? */
    try {
      await this.chatService.storeRoomMessage({
        room_id: message.room,
        message: toStore,
      });
    } catch (e) {
      if (e.status === 403)
        this.announce(
          clientSocket,
          new ChatAnnouncementFromServer(`you've been muted`),
        );

      return;
    }

    /* To all WS instances */
    this.amqpConnection.publish(
      this.roomTX(message.room),
      this.roomRK('message', message.room),
      new RmqEvent(new ChatMessageFromServer(sender, message.payload)),
    );
  }

  //'======================================================================'//
  //'                        RabbitMQ event handler                        '//
  //'======================================================================'//

  /* handler for room queue */
  async chatRoomEventHandler(ev: RmqEvent, rawMsg: ConsumeMessage) {
    const re = /(?<=event.on.chat.)(.*)(?=.rk)/;
    const parsed = re.exec(rawMsg.fields.routingKey)[0].split('.');
    const params: RoutingKeyParams = { evType: parsed[0], roomId: parsed[1] };

    const command: EventCommand = this.commandFactory.getCommand(ev, params);
    if (command) await command.execute(this);
  }

  //#======================================================================#//
  //#                                ETC                                   #//
  //#======================================================================#//

  makeUserKey(userId: string) {
    return 'user:' + userId;
  }

  async setConnSocketId(userId: string, sockId: string) {
    await this.redisService.hsetJson(this.makeUserKey(userId), {
      chat_sock: sockId,
    });
  }
  async getConnSocketId(userId: string) {
    return this.redisService.hget(this.makeUserKey(userId), 'chat_sock');
  }

  getClientSocket(sockId: string): Socket {
    return this.server.sockets.sockets.get(sockId);
  }

  getUser(clientSocket: Socket): UserInfo {
    return clientSocket['user_info'];
  }

  roomQ(roomId: string) {
    return `chat.room.${roomId}.${this.serverId}.q`;
  }

  roomTX(roomId: string) {
    return `chat.${roomId}.t.x`;
  }

  roomRK(eventName: string, roomId: string) {
    return `event.on.chat.${eventName}.${roomId}.rk`;
  }

  async bindUser(clientSocket: Socket) {
    /* get user info */
    const access_token = clientSocket.handshake.auth['access_token'];
    let user;
    try {
      user = await this.authService.verifyJwt(access_token);
    } catch (e) {
      throw new WsException(e);
    }

    /* bind user info to socket */
    clientSocket['user_info'] = user;
    return user;
  }

  getServer() {
    return this.server;
  }
}
