import { AuthGuard } from 'src/common/http/guard/auth.guard';
import { FriendService } from './friend.service';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../user/user.service';

/*
 @ GET friend/request/sended
 @ GET friend/request/received
 @ GET friend/all


 @ POST friend/request/{nickname}
 @ POST friend/{requestId}/accept      // 요청 수락
 @ POST friend/{requestId}/reject      // 요청 거절

 @ DELETE friend/request/{requestId}   // 요청 취소
 @ DELETE friend/{nickname}
 */

@Controller('friend')
@UseGuards(AuthGuard)
export class FriendController {
  constructor(
    private readonly friendService: FriendService,
    private readonly userService: UserService,
  ) {}

  @Get('/all')
  async getFriends(@Req() req) {
    return this.friendService.getFriends(req.user.id);
  }

  @Get('/request/sended')
  async getRequestsSended(@Req() req) {
    TODO;
    // return this.friendService.getRequestList(req.user.id);
  }

  @Get('/request/received')
  async getRequestsReceived(@Req() req) {
    return this.friendService.getRequestsReceived(req.user.id);
  }

  //=======================================================================//

  @HttpCode(201)
  @Post('/request/:nickname')
  async makeRequest(@Param('nickname') nickname: string, @Req() req) {
    const userProfile = await this.userService.getUserByNickname(nickname);
    return this.friendService.makeRequest(req.user.id, userProfile.id);
  }

  @HttpCode(201)
  @Post('/request/:requestId/accept')
  async acceptRequest(@Param('requestId') requestId, @Req() req) {
    //TODO: by requestID
    // return this.friendService.acceptRequest(req.user.id, id);
  }

  @HttpCode(204)
  @Post('/request/:requestId/reject')
  async rejectRequest(@Param('requestId') requestId, @Req() req) {
    //TODO: by requestID
    // return this.friendService.deleteFriendRequest(req.user.id, id);
  }

  //=======================================================================//
  @HttpCode(204)
  @Delete('/:requestId')
  async cancelRequest(@Param('requestId') requestId, @Req() req) {
    //TODO: by requestID
    // return this.friendService.deleteFriend(req.user.id, id);
  }

  @HttpCode(204)
  @Delete('/:nickname')
  async deleteFriend(@Param('nickname') nickname: string, @Req() req) {
    //TODO: by nickname
    // return this.friendService.deleteFriend(req.user.id, id);
  }
}
