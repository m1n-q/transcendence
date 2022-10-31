import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { AppService } from './app.service';
import { RmqErrorFactory } from './common/rmq/rmq-error.factory';
import { RmqErrorHandler } from './common/rmq/rmq-error.handler';
import { RmqEvent } from './common/rmq/types/rmq-event';
import * as amqplib from 'amqplib';

// event.on.<service name>.<event type>[.additional.param].rk

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
    routingKey: 'event.on.user.*.rk',

    /* Competing Consumer must provide queue name*/
    queue: 'event.on.user.q',
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
