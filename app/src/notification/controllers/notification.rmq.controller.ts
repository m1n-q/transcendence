import {
  RabbitPayload,
  RabbitRequest,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { RmqErrorFactory } from '../../common/rmq/rmq-error.factory';
import { RmqErrorHandler } from '../../common/rmq/rmq-error.handler';
import { RmqEvent } from '../../common/rmq/types/rmq-event';
import { ConsumeMessage } from 'amqplib';

// event.on.<service name>.<event type>[.additional.param].rk

@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: RmqErrorFactory('notification-service'),
  }),
)
@Controller()
export class NotificationRmqController {
  constructor(private readonly notificationService: NotificationService) {}

  @RabbitSubscribe({
    exchange: 'user.t.x',
    routingKey: 'event.on.user.*.rk',

    /* Competing Consumer must provide queue name*/
    queue: 'event.on.user.q',
    errorHandler: RmqErrorHandler,
  })
  handleUserEvent(
    @RabbitRequest() req: ConsumeMessage,
    @RabbitPayload() msg: RmqEvent,
  ): void {
    return this.notificationService.userEventHandler(
      msg,
      req.fields.routingKey,
    );
  }

  @RabbitSubscribe({
    exchange: 'dm.t.x',
    routingKey: 'event.on.dm.*.*.rk',
    queue: 'event.on.dm.q',
    errorHandler: RmqErrorHandler,
  })
  handleDmEvent(
    @RabbitRequest() req: ConsumeMessage,
    @RabbitPayload() msg: RmqEvent,
  ): void {
    return this.notificationService.dmEventHandler(msg, req.fields.routingKey);
  }
}
