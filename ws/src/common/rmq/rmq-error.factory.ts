import { RmqError } from './types/rmq-error';

/* exception factory for NestJS ValidationPipe */
export function RmqErrorFactory(where: string, status = 400) {
  return (errors) => {
    let messages: string[] = [];
    for (const error of errors)
      messages = messages.concat(Object.values(error.constraints));
    throw new RmqError(400, messages, where);
  };
}
