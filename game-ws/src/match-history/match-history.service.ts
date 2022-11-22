import { RmqMatchHistoryGameResult } from './dto/match-result.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { RmqMatchHistoryGameInfo } from './dto/match-info.dto';
import { RmqMatchHistoryRankHistory } from './dto/match-rank-history.dto';
import { RmqMatchHistoryGameId } from './dto/match-game-id.dto';
import { RmqResponse } from 'src/common/rmq-module/types/rmq-response';
import { RmqError } from 'src/common/rmq-module/types/rmq-error';

@Injectable()
export class MatchHistoryService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async createGameInfo(gameInfo) {
    let response;
    try {
      response = await this.amqpConnection.request<
        RmqResponse<RmqMatchHistoryGameInfo>
      >({
        exchange: 'match-history.d.x',
        routingKey: 'req.to.match-history.create.game-info.rk',
        payload: gameInfo,
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: 'Request Time Out (to match-history)',
        where: 'gameWebsocket',
      });
    }
    if (!response.success) throw response.error;
    return response.data;
  }

  async createGameResult(gameResult) {
    let response;
    try {
      response = await this.amqpConnection.request<
        RmqResponse<RmqMatchHistoryGameResult>
      >({
        exchange: 'match-history.d.x',
        routingKey: 'req.to.match-history.create.game-result.rk',
        payload: gameResult,
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: 'Request Time Out (to match-history)',
        where: 'gameWebsocket',
      });
    }
    if (!response.success) throw response.error;
    return response.data;
  }

  async createRankHistory(rankHistory) {
    let response;
    try {
      response = await this.amqpConnection.request<
        RmqResponse<RmqMatchHistoryRankHistory>
      >({
        exchange: 'match-history.d.x',
        routingKey: 'req.to.match-history.create.rank-history.rk',
        payload: rankHistory,
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: 'Request Time Out (to match-history)',
        where: 'gameWebsocket',
      });
    }
    if (!response.success) throw response.error;
    return response.data;
  }

  async readGameResult(gameId) {
    let response;
    try {
      response = await this.amqpConnection.request<
        RmqResponse<RmqMatchHistoryGameId>
      >({
        exchange: 'match-history.d.x',
        routingKey: 'req.to.match-history.read.game-result.rk',
        payload: { game_id: gameId },
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: 'Request Time Out (to match-history)',
        where: 'gameWebsocket',
      });
    }
    if (!response.success) throw response.error;
    return response.data;
  }

  async test(userId, take) {
    let response;
    try {
      response = await this.amqpConnection.request<
        RmqResponse<RmqMatchHistoryGameId>
      >({
        exchange: 'match-history.d.x',
        routingKey: 'req.to.match-history.read.match-history.by.id.rk',
        payload: { user_id: userId, take },
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: 'Request Time Out (to match-history)',
        where: 'gameWebsocket',
      });
    }
    if (!response.success) throw response.error;
    return response.data;
  }
}
