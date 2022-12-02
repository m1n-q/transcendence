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
import { WsExceptionsFilter } from '../common/ws/ws-exceptions.filter';
import { UserProfile } from '../user/types/user-profile';
import { toUserProfile } from '../common/utils/utils';
import { UserService } from '../user/services/user.service';
import { raw } from 'express';

@UseFilters(new WsExceptionsFilter())
@WebSocketGateway(9994, { cors: true })
export class StateGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
    private readonly amqpConnection: AmqpConnection,
    private readonly userService: UserService,
  ) {}

  //@======================================================================@//
  //@                             Connection                               @//
  //@======================================================================@//

  @UseFilters(new WsExceptionsFilter())
  async handleConnection(
    @ConnectedSocket() clientSocket: Socket,
    ...args: any[]
  ) {
    let user: UserProfile;

    try {
      user = await this.bindUser(clientSocket);
    } catch (e) {
      clientSocket.disconnect(true);
      return;
    }

    /* queue per user */
    const res = await this.amqpConnection.channel.assertQueue(
      this.userQ(user.user_id),
      {
        autoDelete: true /* delete if no handler */,
      },
    );

    const users = await this.userService.getFriends(user.user_id);
    const subject = [];
    for (const user of users) subject.push(this.userRK('*', user.user_id));

    /* only one consumer(handler) per user-queue */
    // if (!res.consumerCount) {
    const result = await this.amqpConnection.createSubscriber(
      (ev: RmqEvent, rawMsg) => this.stateEventHandler(ev, rawMsg),
      {
        exchange: process.env.RMQ_STATE_TOPIC,
        queue: this.userQ(user.user_id),
        routingKey: subject,
        errorHandler: (c, m, e) => console.error(e),
        queueOptions: {
          autoDelete: true,
        },
      },
      'stateEventHandler',
    );
    /* save consumerTag per user */
    await this.redisService.hsetJson(`ct:${result.consumerTag}`, {
      state_sock: clientSocket.id,
    });
    /* save consumerTag on socket */
    clientSocket['consumer_tag'] = result.consumerTag;

    console.log(
      `new consumer tag ${result.consumerTag} on user ${user.nickname} / ${user.user_id}`,
    );
    // }

    /* save connected socket per user */
    await this.redisService.hsetJson(this.makeUserKey(user.user_id), {
      state_sock: clientSocket.id,
    });
  }

  async handleDisconnect(@ConnectedSocket() clientSocket: Socket) {
    const user: UserProfile = await this.getUser(clientSocket);

    if (!user) {
      clientSocket.disconnect(true);
      return;
    }

    await this.redisService.hdel(this.makeUserKey(user.user_id), 'state_sock');
    await this.redisService.hdel(
      `ct:${clientSocket['consumer_tag']}`,
      'state_sock',
    );
    await this.amqpConnection.cancelConsumer(clientSocket['consumer_tag']);
  }

  //*======================================================================*//
  //*                           socket.io handler                          *//
  //*======================================================================*//

  //'======================================================================'//
  //'                           RabbitMQ handler                           '//
  //'======================================================================'//

  async stateEventHandler(ev: RmqEvent, rawMsg: ConsumeMessage) {
    const re = /(?<=event.on.state.)(.*)(?=.rk)/;
    const params = re.exec(rawMsg.fields.routingKey)[0].split('.');

    const { 0: evType, 1: userId } = params;

    console.log(`this consumer tag is ${rawMsg.fields.consumerTag}`);

    const clientSock: Socket = this.getClientSocket(
      await this.redisService.hget(
        `ct:${rawMsg.fields.consumerTag}`,
        'state_sock',
      ),
    );
    switch (evType) {
      case 'update':
        clientSock.emit('update', { user: userId, state: ev.data });
        break;
      default:
        console.log('unknown event');
    }
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

  async getUser(clientSocket: Socket): Promise<UserProfile> {
    return clientSocket['user_profile'];
  }

  stateTX() {
    return process.env.RMQ_STATE_TOPIC;
  }

  userQ(userId: string) {
    return `state.user.${userId}.q`;
  }

  userRK(evType: string, userId: string) {
    return `event.on.state.${evType}.${userId}.rk`;
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
    clientSocket['user_profile'] = toUserProfile(user);
    return user;
  }
}
