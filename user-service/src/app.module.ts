import { FriendService } from './friend/friend.service';
import { UserService } from './user/user.service';
import { FriendController } from './friend/friend.controller';
import { UserController } from './user/user.controller';
import { FriendRequest } from './common/entities/Friend_request';
import { Friend } from './common/entities/Friend';
import { BlackList } from './common/entities/Black_list';
import { User } from './common/entities/User';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

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
      entities: [User, BlackList, Friend, FriendRequest],
      synchronize: true,
      dropSchema: true,
      namingStrategy: new SnakeNamingStrategy(),
    }),
    TypeOrmModule.forFeature([User, FriendRequest, Friend, BlackList]),
    RabbitMQModule.forRoot(RabbitMQModule, {
      uri: process.env.RMQ_URI,
      enableControllerDiscovery: true,
    }),
  ],
  controllers: [UserController, FriendController],
  providers: [UserService, FriendService],
})
export class AppModule {}
