import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { RmqEvent } from '../../common/rmq/types/rmq-event';

@Injectable()
export class NotificationService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  handleUserEvent(ev: RmqEvent, rk: string) {
    const re = /(?<=event.on.user.)(.*)(?=.rk)/;
    const evType = re.exec(rk)[0];

    switch (evType) {
      case 'friend-request':
        break;
      default:
        console.log('unknown event');
        return;
    }

    for (const recvUser of ev.recvUsers) {
      const userRk = `event.on.notification.${evType}.${recvUser}.rk`;
      const event = new RmqEvent(ev.payload, [recvUser]);

      this.amqpConnection.publish(
        process.env.RMQ_NOTIFICATION_TOPIC,
        userRk,
        event,
      );
    }
  }
}
