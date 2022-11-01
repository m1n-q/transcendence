import { AuthGuard } from 'src/common/http/guard/auth.guard';
import { UserService } from './user.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  ParseUUIDPipe,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  TwoFactorAuthentication,
  CreateUserRequest,
} from './dto/user.request.dto';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(201)
  @Post()
  async join(@Body() body: CreateUserRequest) {
    return this.userService.join(body);
  }

  @Get()
  async getUser(@Req() req) {
    return this.userService.getById(req.user.data.id);
  }

  @HttpCode(204)
  @Delete()
  deleteUser(@Req() req) {
    return this.userService.deleteById(req.user.data.id);
  }

  @Get('/nickname')
  getNickname(@Req() req) {
    return this.userService.getNicknameById(req.user.data.id);
  }

  @HttpCode(204)
  @Put('/nickname')
  updateNickname(@Req() req, @Body('nickname') nickname: string) {
    return this.userService.updateNicknameById(req.user.data.id, nickname);
  }

  @Get('/nickname/:id')
  getNicknameById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getNicknameById(id);
  }

  @Get('/nickname/find/:nickname')
  getUserByNickname(@Param('nickname') nickname: string) {
    return this.userService.getUserByNickname(nickname);
  }

  @Get('/prof-img')
  getProfileImg(@Req() req) {
    return this.userService.getProfImgById(req.user.data.id);
  }

  @HttpCode(204)
  @Put('/prof-img')
  updateProfileImgById(@Req() req, @Body('profImg') profileImage: string) {
    return this.userService.updateProfImgById(req.user.data.id, profileImage);
  }

  @Get('/prof-img/:id')
  getProfileImgById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getProfImgById(id);
  }

  @Get('/2FA')
  getTwoFactorAuthenticationById(@Req() req) {
    return this.userService.getTwoFactorAuthenticationById(req.user.data.id);
  }

  @HttpCode(204)
  @Put('/2FA')
  updateTwoFactorAuthenticationById(
    @Req() req,
    @Body() body: TwoFactorAuthentication,
  ) {
    return this.userService.updateTwoFactorAuthenticationById(
      req.user.data.id,
      body.info,
      body.key,
    );
  }

  @HttpCode(204)
  @Delete('/2FA')
  deleteTwoFactorAuthenticationById(@Req() req) {
    return this.userService.deleteTwoFactorAuthenticationById(req.user.data.id);
  }

  @Get('/:id')
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getById(id);
  }
}
