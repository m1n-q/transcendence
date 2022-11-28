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

  //@======================================================================@//
  //@                             Connection                               @//
  //@======================================================================@//

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

    /* queue per user */
    const res = await this.amqpConnection.channel.assertQueue(
      this.userQ(user.user_id),
      {
        autoDelete: true /* delete if no handler */,
      },
    );

    /* only one consumer(handler) per room */
    if (!res.consumerCount) {
      this.amqpConnection.createSubscriber(
        this.ntfEventHandler,
        {
          exchange: process.env.RMQ_NOTIFICATION_TOPIC,
          queue: this.userQ(user.user_id),
          routingKey: this.userRK(user.user_id),
          errorHandler: (c, m, e) => this.logger.error(e),
          queueOptions: {
            autoDelete: true,
          },
        },
        'ntfEventHandler',
      );
    }

    /* bind user info to socket */
    clientSocket['user_info'] = user;

    /* save connected socket per user */
    await this.redisService.hsetJson(this.makeUserKey(user.user_id), {
      ntf_sock: clientSocket.id,
    });
  }

  async handleDisconnect(@ConnectedSocket() clientSocket: Socket) {
    const user: UserInfo = await this.getUser(clientSocket);

    if (!user) {
      clientSocket.disconnect(true);
      return;
    }

    //BUG: Cannot read properties of undefined (reading 'user_id')
    this.logger.debug(`< ${user.user_id} > disconnected`);
    await this.redisService.hdel(this.makeUserKey(user.user_id), 'ntf_sock');
    await this.amqpConnection.channel.deleteQueue(this.userQ(user.user_id));
  }

  //*======================================================================*//
  //*                           socket.io handler                          *//
  //*======================================================================*//

  //'======================================================================'//
  //'                           RabbitMQ handler                           '//
  //'======================================================================'//

  async ntfEventHandler(msg: RmqEvent, rawMsg: ConsumeMessage) {
    const re = /(?<=event.on.notification.)(.*)(?=.rk)/;
    const params = re.exec(rawMsg.fields.routingKey)[0].split('.');
    const { 0: evType, 1: userId } = params;

    const clientSock: Socket = this.getClientSocket(
      await this.redisService.hget(this.makeUserKey(userId), 'ntf_sock'),
    );
    clientSock.emit('notification', evType + ': ' + msg.payload);
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

  async getUser(clientSocket: Socket): Promise<UserInfo> {
    return clientSocket['user_info']
      ? clientSocket['user_info']
      : await this.bindUser(clientSocket);
  }

  userQ(userId: string) {
    return `notification.user.${userId}.q`;
  }

  userRK(userId: string) {
    return `event.on.notification.*.${userId}.rk`;
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
