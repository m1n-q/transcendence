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

// 1. 매치 인포 저장 리턴은 저장한 데이터
// 2. 게임 결과 저장 리턴은 저장한 데이터
// 3. 랭킹 게임의 경우 유저 점수 저장 리턴은 유저 저장 데이터

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
  // 게임 아이디 받아서,
  // 게임아이디로 게임 테이블 조인하고,
  // 조인한데이터에서 유저 id를 받아서
  // 유저 id로 변경해서 리턴해주거나
  // 유저 id도 조인이 가능한지 봐서 진행해보자
}
