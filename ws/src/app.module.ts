import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationGateway } from './notification.gateway';
import { AppRmqController } from './app.rmq.controller';
import { RmqService } from './rmq/rmq.service';
import { ChatGateway } from './chat.gateway';

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
  controllers: [AppController, AppRmqController],
  providers: [AppService, AppRmqController, NotificationGateway, RmqService, ChatGateway],
})
export class AppModule {}
