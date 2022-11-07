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
  private logger = new Logger('ChatGateway');

  constructor(
    private readonly authService: AuthService,
    private readonly amqpConnection: AmqpConnection,
    private readonly redisService: RedisService,
  ) {}

  makeUserKey(user_id: string) {
    return 'user:' + user_id;
  }

  getClientSocket(clientId: string): Socket {
    return this.server.sockets.sockets.get(clientId);
  }

  getUser(clientSocket: Socket): UserInfo {
    return clientSocket['user_info'];
  }

  Q(userId: string) {
    return `event.on.chat.${userId}.q`;
  }

  @SubscribeMessage('join')
  async joinRoom(
    @MessageBody() message,
    @ConnectedSocket() clientSocket: Socket,
  ) {
    let user: UserInfo;
    if (!(user = this.getUser(clientSocket)))
      user = await this.bindUser(clientSocket);

    await clientSocket.join(message.room);

    await this.amqpConnection.channel.assertExchange(
      `chat.${message.room}.t.x`,
      'topic',
      {
        autoDelete: true,
      },
    );
    2;
    await this.amqpConnection.channel.bindQueue(
      this.Q(user.user_id),
      `chat.${message.room}.t.x`,
      `event.on.chat.${message.room}.rk`,
    );
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

    this.logger.debug(`< ${user.user_id} > connected`);

    /* create queue per user and bind handler */
    this.amqpConnection.createSubscriber(
      this.chatEventHandler,
      {
        queue: this.Q(user.user_id),
        errorHandler: (c, m, e) => this.logger.error(e),
      },
      'chatEventHandler',
    );

    /* save connected socket per user */
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

    this.logger.debug(`< ${user.user_id} > disconnected`);
    await this.redisService.hdel(this.makeUserKey(user.user_id), 'chat_sock');
    await this.amqpConnection.channel.deleteQueue(
      `event.on.chat.${user.user_id}.q`,
    );
  }

  @SubscribeMessage('publish')
  async publish(
    @MessageBody() message: ChatMessageFromClient,
    @ConnectedSocket() clientSocket: Socket,
  ) {
    const m = new ChatMessageFromServer(
      this.getUser(clientSocket),
      message.payload,
    );

    /* except client socket */
    clientSocket.to(message.room).emit('subscribe', m);
    clientSocket.emit('subscribe_self', m);
  }

  async chatEventHandler(msg: RmqEvent, rawMsg: ConsumeMessage) {
    const re = /(?<=event.on.chat.)(.*)(?=.rk)/;
    const params = re.exec(rawMsg.fields.routingKey)[0].split('.');
    const { 0: evType, 1: userId } = params;

    const clientSock: Socket = this.getClientSocket(
      await this.redisService.hget(this.makeUserKey(userId), 'chat_sock'),
    );
    clientSock.emit('subscribe', evType + ': ' + msg.payload);
  }

  /*

  Rabbit Subscriber:


  */
}
