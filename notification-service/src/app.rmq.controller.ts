import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { AppService } from './app.service';
import { RmqErrorFactory } from './rmq-error.factory';
import { RmqErrorHandler } from './rmq-error.handler';
import * as amqplib from 'amqplib';
import { RmqEvent } from './events/rmq-event';

//TODO: rename event / request routing key

@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: RmqErrorFactory('HERE'),
  }),
)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @RabbitSubscribe({
    exchange: 'user.t.x' /* process.env does not work */,
    routingKey: 'event.on.user.join.rk',

    /* Competing Consumer must provide queue name*/
    queue: 'event.user.q',
    errorHandler: RmqErrorHandler,
  })
  handleUserEvent(
    // @RabbitPayload() msg: abc,   //ISSUE: cannot get rawMessage with @RabbitPayload()
    msg: RmqEvent,
    rawMessage: amqplib.ConsumeMessage,
  ): void {
    return this.appService.handleUserEvent(msg, rawMessage.fields.routingKey);
  }
}
