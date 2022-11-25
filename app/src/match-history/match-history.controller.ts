import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/common/http/guard/auth.guard';
import { MatchHistoryService } from './match-history.service';

@Controller('match-history')
export class MatchHistoryController {
  constructor(private readonly matchHistoryService: MatchHistoryService) {}

  @Get()
  @UseGuards(AuthGuard)
  async getMyProfile(@Req() req) {
    return this.matchHistoryService.getMatchHistoryById({
      user_id: req.user.user_id,
      take: 5,
    });
  }
}
