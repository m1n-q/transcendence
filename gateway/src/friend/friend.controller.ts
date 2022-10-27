import { FriendService } from './friend.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

@Controller('user')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @HttpCode(201)
  @Post(':id/friend-request/:friendId')
  async createFriendRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('friendId', ParseUUIDPipe) friendId: string,
  ) {
    return this.friendService.createFriendRequest(id, friendId);
  }

  @Get('/:id/friend-request')
  async readFriendRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.friendService.readFriendRequest(id);
  }

  @HttpCode(204)
  @Delete('/:id/friend-request/:friendId')
  async deleteFriendRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('friendId', ParseUUIDPipe) friendId: string,
  ) {
    return this.friendService.deleteFriendRequest(id, friendId);
  }

  @HttpCode(201)
  @Post('/:id/blacklist/:blockedId')
  async createFriendBlock(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('blockedId', ParseUUIDPipe) blockedId: string,
  ) {
    return this.friendService.createFriendBlock(id, blockedId);
  }

  @Get('/:id/blacklist')
  async readFriendBlock(@Param('id', ParseUUIDPipe) id: string) {
    return this.friendService.readFriendBlock(id);
  }

  @HttpCode(204)
  @Delete('/:id/blacklist/:blockedId')
  async deleteFriendBlock(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('blockedId', ParseUUIDPipe) blockedId: string,
  ) {
    return this.friendService.deleteFriendBlock(id, blockedId);
  }

  @HttpCode(201)
  @Post('/:id/friends/:friendId')
  async createFriend(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('friendId', ParseUUIDPipe) friendId: string,
  ) {
    return this.friendService.createFriend(id, friendId);
  }

  @Get('/:id/friends')
  async readFriend(@Param('id', ParseUUIDPipe) id: string) {
    return this.friendService.readFriend(id);
  }

  @HttpCode(204)
  @Delete('/:id/friends/:friendId')
  async deleteFriend(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('friendId', ParseUUIDPipe) friendId: string,
  ) {
    return this.friendService.deleteFriend(id, friendId);
  }
}
