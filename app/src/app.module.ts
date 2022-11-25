import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationRmqController } from './notification/controllers/notification.rmq.controller';
import { NotificationService } from './notification/services/notification.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    RabbitMQModule.forRoot(RabbitMQModule, {
      uri: process.env.RMQ_HOST,
      exchanges: [
        {
          name: process.env.RMQ_USER_TOPIC,
          type: 'topic',
        },
        {
          name: process.env.RMQ_NOTIFICATION_TOPIC,
          type: 'topic',
        },
      ],
      enableControllerDiscovery: true,
      connectionInitOptions: { timeout: 20000 },
      defaultRpcTimeout: 20000,
    }),
  ],
  controllers: [NotificationRmqController],
  providers: [NotificationService, NotificationRmqController],
})
export class AppModule {}
