import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConsumeMessage } from 'amqplib';
import { RmqEvent } from '../common/rmq/types/rmq-event';
import { AuthService } from '../auth/auth.service';
import { RedisService } from '../redis-module/services/redis.service';
import { UserInfo } from '../auth/dto/user-info.dto';

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

  async chatEventHandler(msg: RmqEvent, rawMsg: ConsumeMessage) {
    const re = /(?<=event.on.chat.)(.*)(?=.rk)/;
    const params = re.exec(rawMsg.fields.routingKey)[0].split('.');
    const { 0: evType, 1: userId } = params;

    const clientSock: Socket = this.getClientSocket(
      await this.redisService.hget(this.makeUserKey(userId), 'chat_sock'),
    );
    clientSock.emit('message', evType + ': ' + msg.payload);
  }

  async handleConnection(
    @ConnectedSocket() clientSocket: Socket,
    ...args: any[]
  ) {
    /* get user info */
    const access_token = clientSocket.handshake.auth['access_token'];
    let user;
    try {
      user = await this.authService.verifyJwt(access_token);
    } catch (e) {
      this.logger.error(e);
      // TODO: if e.code === 401, refresh

      // throw e;
      return;
    }
    this.logger.debug(`< ${user.user_id} > connected`);

    /* create queue per user and bind handler */
    this.amqpConnection.createSubscriber(
      this.chatEventHandler,
      {
        exchange: process.env.RMQ_NOTIFICATION_TOPIC,
        queue: `event.on.chat.${user.user_id}.q`,
        routingKey: `event.on.chat.*.${user.user_id}.rk`,
        errorHandler: (c, m, e) => this.logger.error(e),
      },
      'chatEventHandler',
    );

    /* bind user info to socket */
    clientSocket['user_info'] = user;

    /* save connected socket per user */
    await this.redisService.hsetJson(this.makeUserKey(user.user_id), {
      chat_sock: clientSocket.id,
    });
  }

  async handleDisconnect(@ConnectedSocket() clientSocket: Socket) {
    const user: UserInfo = clientSocket['user_info'];
    this.logger.debug(`< ${user.user_id} > disconnected`);
    await this.redisService.hdel(this.makeUserKey(user.user_id), 'chat_sock');
    await this.amqpConnection.channel.deleteQueue(
      `event.on.chat.${user.user_id}.q`,
    );
  }

  /* XXX: echo */
  @SubscribeMessage('publish')
  async publish(
    @MessageBody() message,
    @ConnectedSocket() clientSocket: Socket,
  ) {
    clientSocket.emit('message', {
      user: clientSocket['user_info'],
      payload: message.payload,
    });
  }
}
