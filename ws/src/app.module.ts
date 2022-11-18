import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AuthService } from './auth/auth.service';
import { NotificationGateway } from './notification/notification.gateway';
import { ChatGateway } from './chat/chat.gateway';
import { RedisModule } from './redis-module/redis.module';
import { ChatService } from './chat/services/chat.service';

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
          name: process.env.RMQ_NOTIFICATION_TOPIC,
          type: 'topic',
        },
      ],
    }),
    RedisModule,
  ],
  controllers: [],
  providers: [AuthService, NotificationGateway, ChatGateway, ChatService],
})
export class AppModule {}
