import { RmqModule } from './../rmq.module';
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [RmqModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [RmqModule],
})
export class UserModule {}
