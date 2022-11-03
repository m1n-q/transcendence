import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

@Injectable()
export class BlockService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async blockUser(id, blockedId) {
    let response;
    try {
      response = await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.create.friend.block.rk',
        payload: {
          blocker: id,
          blocked: blockedId,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-service failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return response;
  }

  async cancelBlock(blockListId) {
    let response;
    try {
      response = await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.delete.friend.block.rk',
        payload: {
          blockListId: blockListId,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-service failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
  }

  async getBlockList(id) {
    let response;
    try {
      response = await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.read.friend.block.rk',
        payload: {
          userId: id,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-service failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return response;
  }
}
