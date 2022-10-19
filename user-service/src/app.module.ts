import { FriendRequest } from './entities/Friend_request';
import { Friend } from './entities/Friend';
import { BlackList } from './entities/Black_list';
import { User } from './entities/User';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
      host: 'localhost',
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
