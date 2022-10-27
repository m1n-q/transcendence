import { FriendService } from './friend.service';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

@Controller('user/friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}
  @HttpCode(201)
  @Post('/request')
  async createFriendRequest(@Body() body) {
    console.log(body);
    return this.friendService.createFriendRequest(body);
  }

  @Get('/request/:id')
  async readFriendRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.friendService.readFriendRequest(id);
  }

  @Post('/request/delete')
  async deleteFriendRequest(@Body() body) {
    return this.friendService.deleteFriendRequest(body);
  }

  @HttpCode(201)
  @Post('/block')
  async createFriendBlock(@Body() body) {
    console.log(body);
    return this.friendService.createFriendBlock(body);
  }

  @Get('/block/:id')
  async readFriendBlock(@Param('id', ParseUUIDPipe) id: string) {
    return this.friendService.readFriendBlock(id);
  }

  @Post('/block/delete')
  async deleteFriendBlock(@Body() body) {
    return this.friendService.deleteFriendBlock(body);
  }

  @HttpCode(201)
  @Post()
  async createFriend(@Body() body) {
    console.log(body);
    return this.friendService.createFriend(body);
  }

  @Get('/:id')
  async readFriend(@Param('id', ParseUUIDPipe) id: string) {
    return this.friendService.readFriend(id);
  }

  @Post('/delete')
  async deleteFriend(@Body() body) {
    return this.friendService.deleteFriend(body);
  }
}
