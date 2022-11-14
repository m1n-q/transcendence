import { Logger, UseFilters } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConsumeMessage } from 'amqplib';
import { RmqEvent } from '../common/rmq/types/rmq-event';
import { AuthService } from '../auth/auth.service';
import { RedisService } from '../redis-module/services/redis.service';
import { UserInfo } from '../auth/dto/user-info.dto';
import { WsExceptionsFilter } from '../common/ws/ws-exceptions.filter';
import { v4 } from 'uuid';

class ChatMessageFromClient {
  room: string;
  payload: string;
}

class ChatMessageFromServer {
  constructor(
    private readonly sender: UserInfo,
    private readonly payload: string,
  ) {}
}

@UseFilters(new WsExceptionsFilter())
@WebSocketGateway(9999, { cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;
  private serverId: string;
  private logger = new Logger('ChatGateway');

  constructor(
    private readonly authService: AuthService,
    private readonly amqpConnection: AmqpConnection,
    private readonly redisService: RedisService,
  ) {
    /* gen UUID to distinguish same room name queue */
    this.serverId = v4();
  }

  //@======================================================================@//
  //@                             Connection                               @//
  //@======================================================================@//

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

    //NOTE: UNUSED, may used for DM
    /* create queue per user and bind handler */
    this.amqpConnection.createSubscriber(
      (msg: RmqEvent, rawMsg) => this.chatUserEventHandler(msg, rawMsg),
      {
        queue: this.userQ(user.user_id),
        errorHandler: (c, m, e) => this.logger.error(e),
      },
      'chatUserEventHandler',
    );

    /* map connected socket ID with user ID */
    await this.redisService.hsetJson(this.makeUserKey(user.user_id), {
      chat_sock: clientSocket.id,
    });
  }

  async handleDisconnect(@ConnectedSocket() clientSocket: Socket) {
    let user: UserInfo;

    try {
      user = this.getUser(clientSocket);
    } catch (e) {
      clientSocket.disconnect(true);
      return;
    }

    await this.redisService.hdel(this.makeUserKey(user.user_id), 'chat_sock');
    await this.amqpConnection.channel.deleteQueue(this.userQ(user.user_id));
  }

  //*======================================================================*//
  //*                           socket.io handler                          *//
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
    await this.amqpConnection.createSubscriber(
      (msg: RmqEvent, rawMsg) => this.chatRoomEventHandler(msg, rawMsg), // to bind "this", need arrow function
      {
        exchange: this.roomTX(room),
        queue: this.roomQ(room),
        routingKey: [
          this.roomRK('message', room),
          /* other event may be added */
        ],
        errorHandler: (c, m, e) => this.logger.error(e),
      },
      'chatRoomEventHandler',
    );
  }

  @SubscribeMessage('publish')
  async publish(
    @MessageBody() message: ChatMessageFromClient,
    @ConnectedSocket() clientSocket: Socket,
  ) {
    /* To all WS instances */
    this.amqpConnection.publish(
      this.roomTX(message.room),
      this.roomRK('message', message.room),
      new RmqEvent(
        new ChatMessageFromServer(this.getUser(clientSocket), message.payload),
      ),
    );
  }

  //'======================================================================'//
  //'                           RabbitMQ handler                           '//
  //'======================================================================'//

  /* handler for room queue */
  async chatRoomEventHandler(ev: RmqEvent, rawMsg: ConsumeMessage) {
    const re = /(?<=event.on.chat.)(.*)(?=.rk)/;
    const params = re.exec(rawMsg.fields.routingKey)[0].split('.');
    const { 0: evType, 1: room } = params;
    const senderId = ev.payload['sender']['user_id'];

    switch (evType) {
      /* handle room message from other instances */
      case 'message':
        const clientSockets: any[] = await this.server.in(room).fetchSockets();
        for (const clientSocket of clientSockets) {
          if (this.getUser(clientSocket).user_id == senderId)
            clientSocket.emit('subscribe_self', ev.payload);
          else clientSocket.emit('subscribe', ev.payload);
        }
        break;

      default:
        this.logger.warn(`UNKNOWN ROOMT EVENT: ${evType}`);
    }
  }

  //NOTE: UNUSED, may used for DM
  /* handler for user queue */
  async chatUserEventHandler(ev: RmqEvent, rawMsg: ConsumeMessage) {
    const re = /(?<=event.on.chat.)(.*)(?=.rk)/;
    const params = re.exec(rawMsg.fields.routingKey)[0].split('.');
    const { 0: evType, 1: userId } = params;

    const clientSock: Socket = this.getClientSocket(
      await this.redisService.hget(this.makeUserKey(userId), 'chat_sock'),
    );
    // clientSock.emit('subscribe', evType + ': ' + ev.payload);
  }

  //#======================================================================#//
  //#                                ETC                                   #//
  //#======================================================================#//

  makeUserKey(user_id: string) {
    return 'user:' + user_id;
  }

  getClientSocket(clientId: string): Socket {
    return this.server.sockets.sockets.get(clientId);
  }

  getUser(clientSocket: Socket): UserInfo {
    return clientSocket['user_info'];
  }

  userQ(userId: string) {
    return `chat.user.${userId}.q`;
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
}
