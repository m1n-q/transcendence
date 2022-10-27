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
} from '@nestjs/common';
import { TwoFactorAuthenticationDto } from './dto/twoFactorAuthentication.dto';

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
    // 반환값이 없더라도 return이 없으면 예외가 콘솔로 나오면서 서버 죽음
    return this.userService.deleteById(id);
  }

  @Get('/:id/nickname')
  getNicknameById(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getNicknameById(id);
  }

  @HttpCode(204)
  @Put(':id/nickname')
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

  @HttpCode(201)
  @Post('/friend/request')
  async createFriendRequest(@Body() body) {
    console.log(body);
    return this.userService.createFriendRequest(body);
  }

  @Get('/friend/request/:id')
  async readFriendRequest(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.readFriendRequest(id);
  }

  @Post('/friend/request/delete')
  async deleteFriendRequest(@Body() body) {
    return this.userService.deleteFriendRequest(body);
  }

  @HttpCode(201)
  @Post('/friend/block')
  async createFriendBlock(@Body() body) {
    console.log(body);
    return this.userService.createFriendBlock(body);
  }

  @Get('/friend/block/:id')
  async readFriendBlock(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.readFriendBlock(id);
  }

  @Post('/friend/block/delete')
  async deleteFriendBlock(@Body() body) {
    return this.userService.deleteFriendBlock(body);
  }

  @HttpCode(201)
  @Post('/friend/')
  async createFriend(@Body() body) {
    console.log(body);
    return this.userService.createFriend(body);
  }

  @Get('/friend/:id')
  async readFriend(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.readFriend(id);
  }

  @Post('/friend/delete')
  async deleteFriend(@Body() body) {
    return this.userService.deleteFriend(body);
  }
}
