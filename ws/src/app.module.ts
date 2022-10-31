import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AuthService } from './auth/auth.service';
import { NotificationGateway } from './notification/notification.gateway';
import { RmqService } from './common/rmq/rmq.service';
import { ChatGateway } from './chat/chat.gateway';

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
  ],
  controllers: [],
  providers: [AuthService, NotificationGateway, RmqService, ChatGateway],
})
export class AppModule {}
