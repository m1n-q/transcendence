import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AuthService } from './auth/auth.service';
import { NotificationGateway } from './notification/notification.gateway';
import { ChatGateway } from './chat/chat.gateway';
import { DMGateway } from './dm/dm.gateway';
import { RedisModule } from './redis-module/redis.module';
import { ChatService } from './chat/services/chat.service';
import { CommandFactory } from './chat/types/chat-event-command';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    RabbitMQModule.forRoot(RabbitMQModule, {
      uri: process.env.RMQ_HOST,
      enableControllerDiscovery: true,
      connectionInitOptions: { timeout: 20000 },
      defaultRpcTimeout: 20000,
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
  providers: [
    AuthService,
    NotificationGateway,
    ChatGateway,
    DMGateway,
    ChatService,
    CommandFactory,
  ],
})
export class AppModule {}
