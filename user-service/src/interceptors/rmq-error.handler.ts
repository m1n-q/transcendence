import { HttpException } from '@nestjs/common';
import { RmqError, RmqResponse } from '../user/dto/rmq-response.dto';
import * as amqplib from 'amqplib';

export function RmqErrorHandler(
  channel: amqplib.Channel,
  msg: amqplib.ConsumeMessage,
  error: any,
) {
  if (error instanceof HttpException) {
    error = new RmqError(
      error.getStatus(),
      error.getResponse().toString(),
      'user-service',
    );
  } else if (typeof error !== 'string' && !(error instanceof RmqError)) {
    error = JSON.stringify(error);
  }

  const errorResponse = new RmqResponse(error, false);

  const { replyTo, correlationId } = msg.properties;
  if (replyTo) {
    error = Buffer.from(JSON.stringify(errorResponse));

    channel.publish('', replyTo, error, { correlationId });
    channel.ack(msg);
  }
}
