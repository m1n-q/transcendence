import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameInfo } from 'src/common/entities/game-info.entity';
import { GameResult } from 'src/common/entities/game-result.entity';
import { RankHistory } from 'src/common/entities/rank-history';
import { User } from 'src/common/entities/user.entity';
import { RmqError } from 'src/common/rmq-module/types/rmq-error';
import { DataSource, Repository } from 'typeorm';
import { RmqMatchHistoryGameIdDto } from './dto/rmq.match-history.game-id.dto';
import {
  GameMode,
  RmqMatchHistoryGameInfoDto,
} from './dto/rmq.match-history.game-info.dto';
import { RmqMatchHistoryGameResultDto } from './dto/rmq.match-history.game-result.dto';
import { RmqMatchHistoryRankHistoryDto } from './dto/rmq.match-history.rank-history.dto';
import {
  RmqMatchHistoryGame,
  RmqMatchHistoryGameInfo,
  RmqMatchHistoryGameResult,
  RmqMatchHistoryRankHistory,
} from './match-history.response.info';
import { RmqMatchHistoryReadByIdDto } from './dto/rmq.match-history.read-by-id.dto';

const WHERE = 'match-history';

@Injectable()
export class MatchHistoryService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(GameInfo)
    private gameInfoRepository: Repository<GameInfo>,
    @InjectRepository(GameResult)
    private gameResultRepository: Repository<GameResult>,
    @InjectRepository(RankHistory)
    private rankHistoryRepository: Repository<RankHistory>,
    private dataSource: DataSource,
  ) {}

  async createGameInfo(
    payload: RmqMatchHistoryGameInfoDto,
  ): Promise<RmqMatchHistoryGameInfo> {
    const gameInfo = this.gameInfoRepository.create(payload);
    let response;
    try {
      response = await this.gameInfoRepository.save(gameInfo);
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    return response;
  }

  async createGameResult(
    payload: RmqMatchHistoryGameResultDto,
  ): Promise<RmqMatchHistoryGameResult> {
    const gameResult = this.gameResultRepository.create(payload);
    let response;
    try {
      response = await this.gameResultRepository.save(gameResult);
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    return response;
  }

  async createRankHistory(
    payload: RmqMatchHistoryRankHistoryDto,
  ): Promise<RmqMatchHistoryRankHistory> {
    let user;
    try {
      user = await this.userRepository.findOne({
        where: { user_id: payload.user_id },
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    user.mmr += payload.delta;
    if (user.mmr < 0) user.mmr = 0;
    const rankHistory = this.rankHistoryRepository.create(payload);

    let response;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      response = await this.rankHistoryRepository.save(rankHistory);
      await this.userRepository.save(user);
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    } finally {
      await queryRunner.release();
    }
    return response;
  }

  deleteUserInfo(user, score: number) {
    delete user.provider;
    delete user.third_party_id;
    delete user.two_factor_authentication_key;
    delete user.two_factor_authentication_type;
    delete user.deleted;
    delete user.created;
    user['score'] = score;
    return user;
  }

  formattingGameResult(result) {
    const lPlayer = this.deleteUserInfo(
      result.game_info.l_player,
      result.l_player_score,
    );
    const rPlayer = this.deleteUserInfo(
      result.game_info.r_player,
      result.r_player_score,
    );
    const winner =
      result.winner_id === lPlayer.user_id
        ? lPlayer.nickname
        : rPlayer.nickname;
    return {
      game_id: result.game_id,
      winner,
      game_end: result.end_time.toString(),
      game_start: result.game_info.start_time.toString(),
      difficulty: result.game_info.difficulty,
      mode: result.game_info.mode,
      l_player: lPlayer,
      r_player: rPlayer,
    };
  }

  async readGameResult(
    payload: RmqMatchHistoryGameIdDto,
  ): Promise<RmqMatchHistoryGame> {
    let result;
    try {
      result = await this.gameResultRepository.findOne({
        where: { game_id: payload.game_id },
        relations: {
          game_info: {
            l_player: true,
            r_player: true,
          },
        },
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    return this.formattingGameResult(result);
  }

  async readMatchHistoryById(payload: RmqMatchHistoryReadByIdDto) {
    let matchHistory;
    try {
      matchHistory = await this.gameResultRepository.find({
        relations: {
          game_info: {
            l_player: true,
            r_player: true,
          },
        },
        order: {
          end_time: 'DESC',
        },
        where: [
          {
            game_info: {
              l_player_id: payload.user_id,
              mode: GameMode.RANK,
            },
          },
          {
            game_info: {
              r_player_id: payload.user_id,
              mode: GameMode.RANK,
            },
          },
        ],
        take: payload.take,
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    const reFormattedMatchHistory = matchHistory.map((result) => {
      const reFormatted = this.formattingGameResult(result);
      delete reFormatted.l_player.mmr;
      delete reFormatted.r_player.mmr;
      return reFormatted;
    });
    return reFormattedMatchHistory;
  }
}
