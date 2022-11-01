import { FriendRequest } from './common/entities/Friend_request';
import { Friend } from './common/entities/Friend';
import { BlackList } from './common/entities/Black_list';
import { User } from './common/entities/User';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { UserModule } from './user/user.module';
import { FriendModule } from './friend/friend.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.HOST,
      port: 5432,
      username: 'toh',
      password: '',
      database: 'transcendence',
      entities: [User, BlackList, Friend, FriendRequest],
      synchronize: true,
      // dropSchema: true,
      namingStrategy: new SnakeNamingStrategy(),
    }),
    UserModule,
    FriendModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
