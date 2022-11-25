import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { RmqResponse } from 'src/common/rmq/types/rmq-response';

@Injectable()
export class MatchHistoryService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async getMatchHistoryById(data) {
    let response: RmqResponse;

    try {
      response = await this.amqpConnection.request({
        exchange: 'match-history.d.x',
        routingKey: 'req.to.match-history.read.match-history.by.id.rk',
        payload: data,
      });
    } catch (reqFail) {
      throw new InternalServerErrorException('request to match-history failed');
    }

    if (!response.success)
      throw new HttpException(
        `${response.error.message} / where: ${response.error.where}`,
        response.error.code,
      );
    return response.data;
  }
}
