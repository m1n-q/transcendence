import { UserProfile } from './../user/user-info';
import { GameService } from './game.service';
import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/http/guard/auth.guard';
import { UserService } from 'src/user/user.service';

@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly userService: UserService,
  ) {}

  @Get('invitation/:nickname')
  @UseGuards(AuthGuard)
  async invitationByNickname(@Req() req, @Param('nickname') nickname: string) {
    const recvUsers: UserProfile = await this.userService.getUserByNickname(
      nickname,
    );
    const userProfile: UserProfile = await this.userService.getUserByNickname(
      req.user.nickname,
    );
    return this.gameService.invitationById(recvUsers.user_id, userProfile);
  }
}
