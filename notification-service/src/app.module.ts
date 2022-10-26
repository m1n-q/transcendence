import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.rmq.controller';
import { AppService } from './app.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RmqService } from './rmq/rmq.service';
import { TempController } from './temp.controller';

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
    }),
  ],
  controllers: [AppController, TempController],
  providers: [AppService, AppController, RmqService],
})
export class AppModule {}
