import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RmqService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  sendMessage(exchange, rk, payload) {
    payload['created'] = new Date();
    this.amqpConnection.publish(exchange, rk, payload);
  }
}
