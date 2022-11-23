import { BlockController } from './block/block.controller';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { FriendService } from './friend/friend.service';
import { UserService } from './user/user.service';
import { FriendController } from './friend/friend.controller';
import { UserController } from './user/user.controller';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { TestController } from './test.controller';
import { BlockService } from './block/block.service';
import { ChatService } from './chat/services/chat.service';
import { ChatController } from './chat/controllers/chat.controller';
import { MatchHistoryController } from './match-history/match-history.controller';
import { MatchHistoryService } from './match-history/match-history.service';
import { AwsModule } from './common/aws/aws.module';
import { AwsService } from './common/aws/aws.service';

@Module({
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: 'user.d.x',
          type: 'direct',
        },
        {
          name: 'user.t.x',
          type: 'topic',
        },
        {
          name: 'match-history.d.x',
          type: 'direct',
        },
      ],
      uri: 'amqp://guest:guest@localhost:5672',
      connectionInitOptions: { timeout: 20000 },
      defaultRpcTimeout: 20000,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AwsModule,
  ],
  controllers: [
    AuthController,
    UserController,
    AuthController,
    FriendController,
    BlockController,
    TestController,
    ChatController,
    MatchHistoryController,
  ],
  providers: [
    AuthService,
    AwsService,
    UserService,
    FriendService,
    BlockService,
    ChatService,
    MatchHistoryService,
  ],
})
export class AppModule {}
