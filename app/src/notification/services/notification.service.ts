import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { RmqEvent } from '../../common/rmq/types/rmq-event';
import { DMFromServer } from '../types/dm/dm-format';

@Injectable()
export class NotificationService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  userEventHandler(ev: RmqEvent, rk: string) {
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
      const userRk = `event.on.notification.user:${evType}.${recvUser}.rk`;
      const event = new RmqEvent(ev.data, [recvUser]);

      this.amqpConnection.publish(
        process.env.RMQ_NOTIFICATION_TOPIC,
        userRk,
        event,
      );
    }
  }

  dmEventHandler(ev: RmqEvent<DMFromServer>, rk: string) {
    const re = /(?<=event.on.dm.)(.*)(?=.rk)/;
    const parsed = re.exec(rk)[0].split('.');
    const params = { evType: parsed[0], dmRoomName: parsed[1] };
    const users = params.dmRoomName.split(':');

    switch (params.evType) {
      case 'message' /* only if user not in dm websocket, */:
        break;
      default:
        console.log('unknown event');
        return;
    }

    for (const recvUser of ev.recvUsers) {
      const userRk = `event.on.notification.dm:${params.evType}.${recvUser}.rk`;
      const event = new RmqEvent(ev.data, [recvUser]);

      this.amqpConnection.publish(
        process.env.RMQ_NOTIFICATION_TOPIC,
        userRk,
        event,
      );
    }
  }
}
