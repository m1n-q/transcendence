import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RmqService } from './services/rmq.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: './src/rmq/.env',
    }),
    RabbitMQModule.forRoot(RabbitMQModule, {
      uri: process.env.RMQ_HOST,
      exchanges: [
        {
          name: 'user.d.x',
          type: 'direct',
        },
      ],
      enableControllerDiscovery: true,
    }),
  ],
  providers: [RmqService],
  exports: [RabbitMQModule, RmqService],
})
export class RmqModule {}
