import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs';

@Injectable()
export class RmqInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>) {
    // Do nothing if this is a RabbitMQ event
    if (isRabbitContext(context)) {
      return next.handle().pipe(
        map((data) => ({
          success: true,
          data,
          error: null,
        })),
      );
    }

    // Execute custom interceptor logic for HTTP request/response
    return next.handle();
  }
}
