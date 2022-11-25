import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { UseFilters, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  ConnectedSocket,
  SubscribeMessage,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { ConsumeMessage } from 'amqplib';
import { Server, Socket, BroadcastOperator } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { AuthService } from '../auth/auth.service';
import { UserInfo } from '../auth/dto/user-info.dto';
import { RmqEvent } from '../common/rmq/types/rmq-event';
import { WsExceptionsFilter } from '../common/ws/ws-exceptions.filter';
import { RedisService } from '../redis-module/services/redis.service';
import { v4 } from 'uuid';
import {
  DMFormat,
  DMFromClient,
  DMFromServer,
} from './types/chat-message-format';

@UseFilters(new WsExceptionsFilter())
@WebSocketGateway(9992, { cors: true })
export class DMGateway
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
  ) {
    /* gen UUID to distinguish same roomId queue at other WS */
    this.serverId = v4();
  }

  //@======================================================================@//
  //@                             Connection                               @//
  //@======================================================================@//

  async afterInit(server: Server) {
    /* when last user of chat-room on this ws-instance exit, delete room-queue */
    server.of('/').adapter.on('delete-room', async (dmRoom) => {
      try {
        await this.amqpConnection.channel.deleteQueue(this.dmRoomQ(dmRoom));
      } catch (e) {
        console.log(`Failed to delete ${this.dmRoomQ(dmRoom)}`);
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
    await this.redisService.hdel(this.makeUserKey(user.user_id), 'dm_sock');
  }

  //*======================================================================*//
  //*                         socket.io message emitter                    *//
  //*======================================================================*//

  send(
    evName: string,
    socket: Socket | BroadcastOperator<DefaultEventsMap, null>,
    payload: DMFormat,
  ) {
    socket.emit(evName, payload);
  }

  sendMessage(
    socket: Socket | BroadcastOperator<DefaultEventsMap, null>,
    payload,
  ) {
    socket.emit('subscribe', payload);
  }
  echoMessage(
    socket: Socket | BroadcastOperator<DefaultEventsMap, null>,
    payload,
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
    const oppoName = message.opponent;
    const userName = this.getUser(clientSocket).nickname; /* or user_id */
    const dmRoomName = this.makeDmRoomName(userName, oppoName);
    await clientSocket.join(dmRoomName);

    /* topic per room */
    await this.amqpConnection.channel.assertExchange(
      this.dmRoomTX(dmRoomName),
      'topic',
      {
        autoDelete: true,
      },
    );

    /* queue per room-event */
    const roomQueue = await this.amqpConnection.channel.assertQueue(
      this.dmRoomQ(dmRoomName),
      {
        autoDelete: true /* delete if no handler */,
      },
    );
    /* only one consumer(handler) per room */
    if (!roomQueue.consumerCount) {
      await this.amqpConnection.createSubscriber(
        (msg: RmqEvent, rawMsg) => this.chatDmEventHandler(msg, rawMsg),
        {
          exchange: this.dmRoomTX(dmRoomName),
          queue: this.dmRoomQ(dmRoomName) /* subscriber */,
          routingKey: [this.dmRoomRK('message', dmRoomName)],
          errorHandler: (c, m, e) => this.logger.error(e),
          queueOptions: {
            autoDelete: true,
          },
        },
        'chatDmEventHandler',
      );
    }
  }

  @SubscribeMessage('publish')
  async publish(
    @MessageBody() message: DMFromClient,
    @ConnectedSocket() clientSocket: Socket,
  ) {
    const sender = this.getUser(clientSocket);
    const dmRoomName = this.makeDmRoomName(sender.nickname, message.oppoName);

    /* To Database */
    //TODO

    /* To all WS instances */
    this.amqpConnection.publish(
      this.dmRoomTX(dmRoomName),
      this.dmRoomRK('message', dmRoomName),
      new RmqEvent(new DMFromServer(sender, message.payload)),
    );
  }

  //'======================================================================'//
  //'                        RabbitMQ event handler                        '//
  //'======================================================================'//

  /* handler for room queue */
  async chatDmEventHandler(ev: RmqEvent, rawMsg: ConsumeMessage) {
    const re = /(?<=event.on.chat.dm.)(.*)(?=.rk)/;
    const parsed = re.exec(rawMsg.fields.routingKey)[0].split('.');
    const params = { evType: parsed[0], dmRoomName: parsed[1] };

    const users = params.dmRoomName.split(':');
    const clientSockets: any[] = await this.getServer()
      .in(params.dmRoomName)
      .fetchSockets();

    /* handle dm from other instances */
    const senderId = ev.payload['sender']['user_id'];
    for (const clientSocket of clientSockets) {
      const receiver = this.getUser(clientSocket);
      /* only two user can get message */
      if (!users.includes(receiver.nickname)) continue; // may warn
      const emit =
        receiver.user_id == senderId ? this.echoMessage : this.sendMessage;
      emit(clientSocket, ev.payload);
    }
  }

  //#======================================================================#//
  //#                                ETC                                   #//
  //#======================================================================#//

  makeUserKey(userId: string) {
    return 'user:' + userId;
  }

  async setConnSocketId(userId: string, sockId: string) {
    await this.redisService.hsetJson(this.makeUserKey(userId), {
      dm_sock: sockId,
    });
  }
  async getConnSocketId(userId: string) {
    return this.redisService.hget(this.makeUserKey(userId), 'dm_sock');
  }

  getClientSocket(sockId: string): Socket {
    return this.server.sockets.sockets.get(sockId);
  }

  getUser(clientSocket: Socket): UserInfo {
    return clientSocket['user_info'];
  }

  dmRoomQ(dmRoomId: string) {
    return `chat.dm.${dmRoomId}.${this.serverId}.q`;
  }

  dmRoomTX(dmRoomId: string) {
    return `chat.dm.${dmRoomId}.t.x`;
  }

  dmRoomRK(eventName: string, dmRoomId: string) {
    return `event.on.chat.dm.${eventName}.${dmRoomId}.rk`;
  }

  makeDmRoomName(userName: string, oppoName: string) {
    return userName > oppoName
      ? `${userName}:${oppoName}`
      : `${oppoName}:${userName}`;
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
