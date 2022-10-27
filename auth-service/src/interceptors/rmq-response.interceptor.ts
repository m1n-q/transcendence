import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RmqError } from '../dto/rmq-error';
import { RmqResponse } from '../dto/rmq-response';

@Injectable()
export class RmqResponseInterceptor<T>
  implements NestInterceptor<T, RmqResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<RmqResponse<T>> {
    if (!isRabbitContext(context)) return next.handle();

    return next.handle().pipe(
      map((data: T | RmqError) => {
        if (data instanceof RmqError)
          return {
            success: false,
            data: null,
            error: data,
          };
        else {
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
