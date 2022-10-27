import { AuthGuard } from './auth.guard';
import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    RabbitMQModule.forRoot(RabbitMQModule, {
      exchanges: [
        {
          name: 'user.d.x',
          type: 'direct',
        },
      ],
      uri: 'amqp://guest:guest@localhost:5672',
    }),
  ],
  controllers: [],
  providers: [RmqModule, AuthGuard],
  exports: [RabbitMQModule],
})
export class RmqModule {}
