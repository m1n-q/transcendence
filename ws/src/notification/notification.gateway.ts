import { Logger, UseFilters } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConsumeMessage } from 'amqplib';
import { RmqEvent } from '../common/rmq/types/rmq-event';
import { RedisService } from '../redis-module/services/redis.service';
import { AuthService } from '../auth/auth.service';
import { UserInfo } from '../auth/dto/user-info.dto';
import { WsExceptionsFilter } from '../common/ws/ws-exceptions.filter';

@UseFilters(new WsExceptionsFilter())
@WebSocketGateway(1234, { cors: true })
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;
  private logger = new Logger('NotificationGateway');

  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
    private readonly amqpConnection: AmqpConnection,
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
  async bindUser(clientSocket: Socket) {
    /* get user info */
    const access_token = clientSocket.handshake.auth['access_token'];
    let user;
    try {
      user = await this.authService.verifyJwt(access_token);
    } catch (e) {
      // TODO: if e.code === 401, refresh
      throw new WsException(e);
    }

    /* bind user info to socket */
    clientSocket['user_info'] = user;
    return user;
  }

  async ntfEventHandler(msg: RmqEvent, rawMsg: ConsumeMessage) {
    const re = /(?<=event.on.notification.)(.*)(?=.rk)/;
    const params = re.exec(rawMsg.fields.routingKey)[0].split('.');
    const { 0: evType, 1: userId } = params;

    const clientSock: Socket = this.getClientSocket(
      await this.redisService.hget(this.makeUserKey(userId), 'ntf_sock'),
    );
    clientSock.emit('notification', evType + ': ' + msg.payload);
  }

  @UseFilters(new WsExceptionsFilter())
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
      this.ntfEventHandler,
      {
        exchange: process.env.RMQ_NOTIFICATION_TOPIC,
        queue: `event.on.notification.${user.user_id}.q`,
        routingKey: `event.on.notification.*.${user.user_id}.rk`,
        errorHandler: (c, m, e) => this.logger.error(e),
      },
      'ntfEventHandler',
    );

    /* bind user info to socket */
    clientSocket['user_info'] = user;

    /* save connected socket per user */
    await this.redisService.hsetJson(this.makeUserKey(user.user_id), {
      ntf_sock: clientSocket.id,
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
    await this.redisService.hdel(this.makeUserKey(user.user_id), 'ntf_sock');
    await this.amqpConnection.channel.deleteQueue(
      `event.on.notification.${user.user_id}.q`,
    );
  }
}
