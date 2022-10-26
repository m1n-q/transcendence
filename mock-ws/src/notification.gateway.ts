import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConsumeMessage } from 'amqplib';

//                        TODO                          //
//*
//*
//*  1. 접속 시, userId : Connsocket Id 맵핑  [WS server]
//*  2. 이벤트 수신 시, 수신된 userId로 Connsocket 찾기
//*  3. 종료 시, 맵핑 제거
//*
//*  - Pipe & rawMessage 이슈 등록
//*  - 작업 내용 등록 (queue per user 동적 생성하기, 핸들러 동적 바인딩
//*  - RmqEvent 클래스 설계
//*
//*  @ OAuth2 다시 공부
//*
//*===================================================@//
const userDB = {};

@WebSocketGateway(1234, { cors: true })
export class NotificationGateway implements OnGatewayInit {
  @WebSocketServer()
  private server: Server;
  private logger = new Logger('NotificationGateway');

  constructor(private readonly amqpConnection: AmqpConnection) {}

  afterInit(server: Server) {
    console.log(`ws on ${process.env.WS_PORT}`);
  }

  async newUserHandler(msg, rawMsg: ConsumeMessage) {
    console.log(msg);
    // console.log(rawMsg);
    const sock: Socket = userDB[msg.userId];
    sock.emit('notification', msg.payload);
  }

  @SubscribeMessage('new_user')
  o(@MessageBody() data, @ConnectedSocket() socket: Socket) {
    /* create queue per user */
    this.amqpConnection.createSubscriber(
      this.newUserHandler,
      {
        exchange: process.env.RMQ_NOTIFICATION_TOPIC,
        queue: `notification.user.${data}.q`,
        routingKey: `notification.user.${data}.rk`,
        errorHandler: (c, m, e) => console.log(e),
      },
      'newUserHandler',
    );

    /* save connected socket per user */
    userDB[data] = socket;
  }
}
