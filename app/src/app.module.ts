import { MatchHistoryController } from './match-history/match-history.controller';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { GameInfo } from './common/entities/game-info.entity';
import { GameResult } from './common/entities/game-result.entity';
import { RankHistory } from './common/entities/rank-history';
import { User } from './common/entities/user.entity';
import { MatchHistoryService } from './match-history/match-history.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [User, GameInfo, GameResult, RankHistory],
      synchronize: true,
      // dropSchema: true,
      namingStrategy: new SnakeNamingStrategy(),
      // logging: ['query'],
      poolSize: 20,
    }),
    TypeOrmModule.forFeature([User, GameInfo, GameResult, RankHistory]),
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: 'match-history.d.x',
          type: 'direct',
        },
        {
          name: 'user.d.x',
          type: 'direct',
        },
      ],
      uri: process.env.RMQ_URI,
      enableControllerDiscovery: true,
    }),
  ],
  controllers: [MatchHistoryController],
  providers: [MatchHistoryService],
})
export class AppModule {}
