import { RmqModule } from './rmq.module';
import { Global, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { FriendModule } from './friend/friend.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [UserModule, FriendModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
