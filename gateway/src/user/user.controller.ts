import { AuthGuard } from 'src/common/http/guard/auth.guard';
import { AuthService } from './../auth/auth.service';
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
} from '@nestjs/common';
import {
  TwoFactorAuthenticationDto,
  CreateUserRequestDto,
} from './dto/user.request.dto';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(201)
  @Post()
  async join(@Body() body: CreateUserRequestDto) {
    return this.userService.join(body);
  }

  @Get('/:id')
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getById(id);
  }

  @HttpCode(204)
  @Delete('/:id')
  deleteUserById(@Param('id', ParseUUIDPipe) id: string) {
    // 반환값이 없더라도 return이 없으면 예외가 콘솔로 나오면서 서버 죽음
    return this.userService.deleteById(id);
  }

  @Get('/:id/nickname')
  getNicknameById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getNicknameById(id);
  }

  @HttpCode(204)
  @Put(':/id/nickname')
  updateNicknameById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('nickname') nickname: string,
  ) {
    return this.userService.updateNicknameById(id, nickname);
  }

  @Get('/:id/prof-img')
  getProfileImgById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getProfImgById(id);
  }

  @HttpCode(204)
  @Put('/:id/prof-img')
  updateProfileImgById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('profImg') profileImage: string,
  ) {
    return this.userService.updateProfImgById(id, profileImage);
  }

  @Get('/:id/2FA')
  getTwoFactorAuthenticationById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getTwoFactorAuthenticationById(id);
  }

  @HttpCode(204)
  @Put('/:id/2FA')
  updateTwoFactorAuthenticationById(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: TwoFactorAuthenticationDto,
  ) {
    return this.userService.updateTwoFactorAuthenticationById(
      id,
      body.info,
      body.key,
    );
  }

  @HttpCode(204)
  @Delete('/:id/2FA')
  deleteTwoFactorAuthenticationById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.deleteTwoFactorAuthenticationById(id);
  }
}
