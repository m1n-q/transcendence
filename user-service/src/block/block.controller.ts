import { BlockService } from './block.service';
import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Controller, UseInterceptors } from '@nestjs/common';
import { RmqErrorHandler } from 'src/common/rmq-module/types/rmq-error.handler';
import {
  RmqRequestBlock,
  RmqUserId,
  RmqDeleteBlock,
} from './dto/rmq.block.request';
import { RmqResponseInterceptor } from 'src/common/rmq-module/interceptors/rmq-response.interceptor.ts';

@UseInterceptors(new RmqResponseInterceptor())
@Controller('block')
export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'rmq.to.user.read.block.rk',
    queue: 'rmq.to.user.read.block.q',
    errorHandler: RmqErrorHandler,
  })
  async readBlockList(@RabbitPayload() msg: RmqUserId) {
    return this.blockService.readBlockList(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'rmq.to.user.create.block.rk',
    queue: 'tmq.to.user.create.block.q',
    errorHandler: RmqErrorHandler,
  })
  async createBlock(@RabbitPayload() msg: RmqRequestBlock) {
    return this.blockService.createBlock(msg);
  }

  @RabbitRPC({
    exchange: 'user.d.x',
    routingKey: 'rmq.to.user.delete.block.rk',
    queue: 'rmq.to.user.delete.block.q',
    errorHandler: RmqErrorHandler,
  })
  async deleteBlock(@RabbitPayload() msg: RmqDeleteBlock) {
    return this.blockService.deleteBlock(msg);
  }
}
