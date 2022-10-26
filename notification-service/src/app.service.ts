import { Injectable } from '@nestjs/common';
import { RmqEvent } from './events/rmq-event';
import { RmqService } from './rmq/rmq.service';

@Injectable()
export class AppService {
  constructor(private readonly rmqClient: RmqService) {}

  //XXX: MOCK
  handleUserEvent(ev: RmqEvent, rk: string) {
    const re = /(?<=event.on.user.)(.*)(?=.rk)/;
    const evType = re.exec(rk)[0];

    switch (evType) {
      case 'friend-request':
        break;
      case 'login':
        break;
      default:
        console.log('unknown event');
        return;
    }

    for (const recvUser of ev.recvUsers) {
      const userRk = `notification.user.${recvUser}.rk`;
      this.rmqClient.sendMessage(process.env.RMQ_NOTIFICATION_TOPIC, userRk, {
        userId: recvUser,
        payload: ev.payload,
      });
    }
  }
}
