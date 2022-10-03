import { CreateUserRequestDto } from './dto/create.user.request.dto';
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
  HttpException,
} from '@nestjs/common';

@Controller('user')
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
    this.userService.deleteById(id);
  }

  @Get('/:id/nickname')
  getNicknameById() {
    return 'get nickname by id';
  }

  @Put(':id/nickname')
  updateNicknameById() {
    return 'update nickname by id';
  }

  @Get('/:id/prof-img')
  getProfileImgById() {
    return 'get profile img by id';
  }

  @Put('/:id/prof-img')
  updateProfileImgById() {
    return 'update profile img by id';
  }

  @Get('/:id/2FA')
  getTwoFactorAuthenticationById() {
    return ' get two-factor authentication by id';
  }

  @Put('/:id/2FA')
  updateTwoFactorAuthenticationById() {
    return ' update two-factor authentication by id';
  }

  @Delete('/:id/2FA')
  deleteTwoFactorAuthenticationById() {
    return ' delete two-factor authentication by id';
  }
}
