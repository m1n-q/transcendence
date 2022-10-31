import { AuthGuard } from 'src/common/http/guard/auth.guard';
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
  Req,
  UseGuards,
} from '@nestjs/common';

@Controller('friend')
@UseGuards(AuthGuard)
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @HttpCode(201)
  @Get('/request/:id')
  async createFriendRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req,
  ) {
    return this.friendService.createFriendRequest(req.user.data.id, id);
  }

  @Get('/request-list')
  async readFriendRequest(@Req() req) {
    return this.friendService.readFriendRequest(req.user.data.id);
  }

  @HttpCode(204)
  @Delete('/request/:id')
  async deleteFriendRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req,
  ) {
    return this.friendService.deleteFriendRequest(req.user.data.id, id);
  }

  @HttpCode(201)
  @Get('/blacklist/:id')
  async createFriendBlock(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.friendService.createFriendBlock(req.user.data.id, id);
  }

  @Get('/blacklist-list')
  async readFriendBlock(@Req() req) {
    return this.friendService.readFriendBlock(req.user.data.id);
  }

  @HttpCode(204)
  @Delete('/blacklist/:id')
  async deleteFriendBlock(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.friendService.deleteFriendBlock(req.user.data.id, id);
  }

  @HttpCode(201)
  @Get('/:id')
  async createFriend(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.friendService.createFriend(req.user.data.id, id);
  }

  @Get('/list')
  async readFriend(@Req() req) {
    return this.friendService.readFriend(req.user.data.id);
  }

  @HttpCode(204)
  @Delete('/:id')
  async deleteFriend(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.friendService.deleteFriend(req.user.data.id, id);
  }
}
