import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export enum GameMode {
  RANK = 'rank',
  FRIENDLY = 'friendly',
}

export enum Difficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
}

export class RmqMatchHistoryGameInfo {
  @IsNotEmpty()
  @IsUUID()
  l_player_id: string;

  @IsNotEmpty()
  @IsUUID()
  r_player_id: string;

  @IsNotEmpty()
  @IsString()
  difficulty: Difficulty;

  @IsNotEmpty()
  @IsString()
  mode: GameMode;
}

export class RmqMatchHistoryGameResult {
  @IsNotEmpty()
  @IsUUID()
  game_id: string;

  @IsNotEmpty()
  @IsNumber()
  l_player_score: number;

  @IsNotEmpty()
  @IsNumber()
  r_player_score: number;

  @IsNotEmpty()
  @IsUUID()
  winner_id: string;
}

export class RmqMatchHistoryRankHistory {
  @IsNotEmpty()
  @IsUUID()
  user_id: string;

  @IsNotEmpty()
  @IsUUID()
  game_id: string;

  @IsNotEmpty()
  @IsNumber()
  delta: number;
}

export class RmqMatchHistoryGameId {
  @IsNotEmpty()
  @IsUUID()
  game_id: string;
}

export class RmqMatchHistoryMatchHistory {
  @IsNotEmpty()
  @IsUUID()
  user_id: string;

  @IsNotEmpty()
  @IsNumber()
  take: number;
}
