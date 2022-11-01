import { BlackList } from '../common/entities/Black_list';
import { Friend } from '../common/entities/Friend';
import { UserService } from './../user/user.service';
import { UserModule } from './../user/user.module';
import { User } from 'src/common/entities/User';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { FriendRequest } from 'src/common/entities/Friend_request';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, FriendRequest, Friend, BlackList]),
    UserModule,
    RabbitMQModule.forRoot(RabbitMQModule, {
      uri: 'amqp://guest:guest@localhost:5672',
      enableControllerDiscovery: true,
    }),
  ],
  controllers: [FriendController],
  providers: [FriendService],
})
export class FriendModule {}
