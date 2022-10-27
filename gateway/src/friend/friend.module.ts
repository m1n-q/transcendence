import { RmqModule } from './../rmq.module';
import { Module } from '@nestjs/common';
import { FriendService } from './friend.service';
import { FriendController } from './friend.controller';

@Module({
  imports: [RmqModule],
  providers: [FriendService],
  controllers: [FriendController],
})
export class FriendModule {}
