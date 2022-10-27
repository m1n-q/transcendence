import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
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
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
