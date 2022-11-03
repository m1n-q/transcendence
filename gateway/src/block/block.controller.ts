import { Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { BlockService } from './block.service';

@Controller('block')
export class BlockController {
  constructor(
    private readonly blockService: BlockService,
    private readonly userService: UserService,
  ) {}

  @Get('/list')
  async getBlockList(@Req() req) {
    return this.blockService.getBlockList(req.user.id);
  }

  @Delete('/:blockListId')
  async cancelBlock(@Req() req, @Param('blockListId') blockListId) {
    return this.blockService.cancelBlock(blockListId);
  }

  @Post('/:nickname')
  async blockUser(@Req() req, @Param('nickname') nickname) {
    const userProfile = await this.userService.getUserByNickname(nickname);
    return this.blockService.blockUser(req.user.id, userProfile.id);
  }
}
