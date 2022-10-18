import { RmqResponse, RmqError } from '../user/dto/rmq.user.response.dto';
import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs';

@Injectable()
export class RmqInterceptor<T> implements NestInterceptor<T, RmqResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<any>) {
    if (!isRabbitContext(context)) return next.handle();

    return next.handle().pipe(
      map((data: T) => {
        if (data instanceof RmqError) {
          return {
            success: false,
            data: null,
            error: data,
          };
        } else {
          return {
            success: true,
            data: data,
            error: null,
          };
        }
      }),
    );
  }
}
