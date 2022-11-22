import {
  RmqMatchHistoryGameId,
  RmqMatchHistoryGameInfo,
  RmqMatchHistoryGameResult,
  RmqMatchHistoryMatchHistory,
  RmqMatchHistoryRankHistory,
} from './dto/rmq.mh.request.dto';
import { RmqResponseInterceptor } from './../common/rmq-module/interceptors/rmq-response.interceptor.ts';
import { Controller, UseInterceptors } from '@nestjs/common';
import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { RmqErrorHandler } from 'src/common/rmq-module/types/rmq-error.handler';
import { MatchHistoryService } from './match-history.service';

@UseInterceptors(new RmqResponseInterceptor())
@Controller()
export class MatchHistoryController {
  constructor(private readonly matchHistoryService: MatchHistoryService) {}
  @RabbitRPC({
    exchange: 'match-history.d.x',
    routingKey: 'req.to.match-history.create.game-info.rk',
    queue: 'match-history.create.game-info.q',
    errorHandler: RmqErrorHandler,
  })
  async createGameInfo(@RabbitPayload() msg: RmqMatchHistoryGameInfo) {
    return await this.matchHistoryService.createGameInfo(msg);
  }

  @RabbitRPC({
    exchange: 'match-history.d.x',
    routingKey: 'req.to.match-history.create.game-result.rk',
    queue: 'match-history.create.game-result.q',
    errorHandler: RmqErrorHandler,
  })
  async createGameResult(@RabbitPayload() msg: RmqMatchHistoryGameResult) {
    return await this.matchHistoryService.createGameResult(msg);
  }

  @RabbitRPC({
    exchange: 'match-history.d.x',
    routingKey: 'req.to.match-history.create.rank-history.rk',
    queue: 'match-history.create.rank-history.q',
    errorHandler: RmqErrorHandler,
  })
  async createRankHistory(@RabbitPayload() msg: RmqMatchHistoryRankHistory) {
    return await this.matchHistoryService.createRankHistory(msg);
  }

  @RabbitRPC({
    exchange: 'match-history.d.x',
    routingKey: 'req.to.match-history.read.game-result.rk',
    queue: 'match-history.read.game-result.q',
    errorHandler: RmqErrorHandler,
  })
  async readGameResult(@RabbitPayload() msg: RmqMatchHistoryGameId) {
    return await this.matchHistoryService.readGameResult(msg);
  }

  @RabbitRPC({
    exchange: 'match-history.d.x',
    routingKey: 'req.to.match-history.read.match-history.by.id.rk',
    queue: 'match-history.read.match-history.by.id.q',
    errorHandler: RmqErrorHandler,
  })
  async readMatchHistoryById(
    @RabbitPayload() msg: RmqMatchHistoryMatchHistory,
  ) {
    return await this.matchHistoryService.readMatchHistoryById(msg);
  }
}
