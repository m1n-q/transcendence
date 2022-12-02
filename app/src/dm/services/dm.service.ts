import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RmqResponse } from '../../common/rmq/types/rmq-response';
import { DmDto } from '../dto/dm.dto';

@Injectable()
export class DmService {
  constructor(private readonly amqpConnection: AmqpConnection) {}
  RK(type: 'req' | 'event', name: string) {
    return `${type === 'req' ? 'req.to' : 'event.from'}.${name}.rk`;
  }

  async requestToDmService(routingKey: string, payload) {
    let response: RmqResponse;
    try {
      response = await this.amqpConnection.request<RmqResponse>({
        exchange: process.env.RMQ_DM_DIRECT,
        routingKey,
        payload,
      });
    } catch (reqFail) {
      throw new InternalServerErrorException('request to dm-service failed');
    }
    if (!response.success) throw response.error;
    return response.data;
  }

  async storeMessage(data: DmDto) {
    return this.requestToDmService(this.RK('req', 'dm.store.message'), data);
  }
}
