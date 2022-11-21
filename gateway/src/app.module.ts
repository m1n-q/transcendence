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
      ],
      uri: 'amqp://guest:guest@localhost:5672',
      connectionInitOptions: { timeout: 20000 },
      defaultRpcTimeout: 20000,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [
    AuthController,
    UserController,
    AuthController,
    FriendController,
    BlockController,
    TestController,
    ChatController,
  ],
  providers: [
    AuthService,
    UserService,
    FriendService,
    BlockService,
    ChatService,
  ],
})
export class AppModule {}
