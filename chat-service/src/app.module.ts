import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatService } from './chat/services/chat.service';
import { ChatRmqController } from './chat/controllers/chat.rmq.controller';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatRoom } from './common/entities/chat-room.entity';
import { User } from './common/entities/user.entity';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { ChatRoomMessage } from './common/entities/chat-room-message.entity';
import { ChatRoomUser } from './common/entities/chat-room-user.entity';
import { ChatRoomBanList } from './common/entities/chat-room-ban-list.entity';
import { ChatRoomMuteList } from './common/entities/chat-room-mute-list.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    //   // RabbitMQModule.forRoot(RabbitMQModule, {
    //   //   uri: process.env.RMQ_HOST,
    //   //   exchanges: [
    //   //     {
    //   //       name: process.env.RMQ_CHAT_EXCHANGE,
    //   //       type: 'direct',
    //   //     },
    //   //   ],
    //   //   enableControllerDiscovery: true,
    //   //   connectionInitOptions: { timeout: 20000 },
    //   //   defaultRpcTimeout: 20000,
    //   // }),
    //   // TypeOrmModule.forRoot({
    //   //   type: 'postgres',
    //   //   host: process.env.PG_HOST,
    //   //   port: parseInt(process.env.PG_PORT),
    //   //   username: process.env.PG_USERNAME,
    //   //   password: process.env.PG_PASSWORD,
    //   //   database: process.env.PG_DATABASE,
    //   //   entities: [
    //   //     User,
    //   //     ChatRoom,
    //   //     ChatRoomMessage,
    //   //     ChatRoomUser,
    //   //     ChatRoomBanList,
    //   //     ChatRoomMuteList,
    //   //   ],
    //   //   namingStrategy: new SnakeNamingStrategy(),
    //   //   synchronize: true,
    //   //   // dropSchema: true,
    //   //   poolSize: 20,
    //   // }),
    //   TypeOrmModule.forFeature([
    //     User,
    //     ChatRoom,
    //     ChatRoomMessage,
    //     ChatRoomUser,
    //     ChatRoomBanList,
    //     ChatRoomMuteList,
    //   ]),
  ],
  // controllers: [ChatRmqController],
  // providers: [ChatService, ChatRmqController],
})
export class AppModule {}
