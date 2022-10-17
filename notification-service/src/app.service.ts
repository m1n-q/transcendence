import { Injectable } from '@nestjs/common';
import { RmqEvent } from './events/rmq-event';
import { RmqService } from './rmq/rmq.service';

@Injectable()
export class AppService {
  constructor(private readonly rmqClient: RmqService) {}

  //XXX: MOCK
  handleUserEvent(msg: RmqEvent, rk: string) {
    let payload;
    if (rk === 'user.event.join.rk') payload = 'new user joined';
    else if (rk === 'user.event.login.rk') payload = 'new user logged in';
    else payload = 'unknown event';

    console.log(payload);
    this.rmqClient.sendMessage(process.env.RMQ_NOTIFICATION_EXCHANGE, rk, {
      payload,
    });
  }
}
