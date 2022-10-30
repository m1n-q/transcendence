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
import { RmqService } from './rmq/rmq.service';
import { RmqEvent } from './rmq/types/rmq-event';
import { userInfo } from 'os';

const userDB = {};

@WebSocketGateway(9999, { cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;
  private logger = new Logger('NotificationGateway');

  constructor(
    private readonly rmqService: RmqService,
    private readonly amqpConnection: AmqpConnection,
  ) {}

  async newUserHandler(msg: RmqEvent, rawMsg: ConsumeMessage) {
    const re = /(?<=event.on.chat.)(.*)(?=.rk)/;
    const params = re.exec(rawMsg.fields.routingKey)[0].split('.');
    const { 0: evType, 1: userId } = params;

    const sock: Socket = userDB[userId];
    sock.emit('notification', evType + ': ' + msg.payload);
  }

  async handleConnection(
    @ConnectedSocket() clientSocket: Socket,
    ...args: any[]
  ) {
    /* get user info */
    const access_token = clientSocket.handshake.auth['access_token'];
    let user;
    try {
      user = await this.rmqService.verifyJwt(access_token);
    } catch (e) {
      this.logger.error(e);
      // TODO: if e.code === 401, refresh

      // throw e;
      return;
    }
    this.logger.debug(`< ${user.id} > connected to chat`);

    /* create queue per user and bind handler */
    this.amqpConnection.createSubscriber(
      this.newUserHandler,
      {
        exchange: process.env.RMQ_NOTIFICATION_TOPIC,
        queue: `event.on.chat.${user.id}.q`,
        routingKey: `event.on.chat.*.${user.id}.rk`,
        errorHandler: (c, m, e) => this.logger.error(e),
      },
      'newUserHandler',
    );
    clientSocket['userInfo'] = user;
    /* save connected socket per user */
    userDB[user.id] = clientSocket;
  }

  //NOTE: userID: socketId 형태로 맵핑되어 있으나, 연결 종료시 주어진 정보는 socket ID 입니다. 효율적으로 삭제하기 위한 재설계가 필요합니다.
  async handleDisconnect(@ConnectedSocket() clientSocket: Socket) {
    // delete userDB['']
  }

  /* XXX: echo */
  @SubscribeMessage('publish')
  async publish(
    @MessageBody() message,
    @ConnectedSocket() clientSocket: Socket,
  ) {
    clientSocket.emit('message', {
      user: clientSocket['userInfo'],
      payload: message.payload,
    });
  }
}
