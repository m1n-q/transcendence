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
        map((data) => {
          if (data.success === 'true') {
            return {
              success: true,
              data: data.data,
              error: null,
            };
          } else if (data.success === 'false') {
            return {
              success: false,
              data: null,
              error: {
                code: data.code,
                message: data.message,
                where: 'user-service',
              },
            };
          } else {
            return {
              success: false,
              data: null,
              error: {
                code: 500,
                message: 'internal server error',
                where: 'user-service',
              },
            };
          }
        }),
      );
    }

    // Execute custom interceptor logic for HTTP request/response
    return next.handle();
  }
}
