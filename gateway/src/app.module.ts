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
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [
    AuthController,
    UserController,
    FriendController,
    TestController,
  ],
  providers: [AuthService, UserService, FriendService, BlockService],
})
export class AppModule {}
