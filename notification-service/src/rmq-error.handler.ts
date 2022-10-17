import * as amqplib from 'amqplib';
import { RmqError } from './rmq-error';
import { RmqResponse } from './rmq-response';

export function RmqErrorHandler(
  channel: amqplib.Channel,
  msg: amqplib.ConsumeMessage,
  error: any,
) {
  console.log(error);
  // console.log(msg);
  if (typeof error !== 'string' && !(error instanceof RmqError)) {
    error = JSON.stringify(error);
  }
  const errorResponse = new RmqResponse(error, false);

  const { replyTo, correlationId } = msg.properties;
  if (replyTo) {
    error = Buffer.from(JSON.stringify(errorResponse));

    channel.publish('', replyTo, error, { correlationId });
    channel.ack(msg);
  } else {
    /* for async messages */
    channel.ack(msg);
    return;
  }
}
