import { MatchHistoryService } from './match-history/match-history.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth/auth.service';
import { GameGateway } from './game/game.gateway';
import { UserService } from './user/user.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    RabbitMQModule.forRoot(RabbitMQModule, {
      uri: process.env.RMQ_HOST,
      enableControllerDiscovery: true,
      exchanges: [
        {
          name: 'auth.d.x',
          type: 'direct',
        },
        {
          name: 'user.d.x',
          type: 'direct',
        },
        {
          name: 'match-history.d.x',
          type: 'direct',
        },
      ],
      defaultRpcTimeout: 20000,
    }),
  ],
  providers: [AuthService, UserService, MatchHistoryService, GameGateway],
})
export class AppModule {}
