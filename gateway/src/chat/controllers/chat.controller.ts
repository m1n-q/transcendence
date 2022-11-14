import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { ChatRoomCreationDto } from '../dto/chat-room-creation.dto';
import { ChatRoomJoinDto } from '../dto/chat-room-join.dto';
import { ChatRoomMessageDto } from '../dto/chat-room-message.dto';
import { ChatRoomPenaltyDto } from '../dto/chat-room-penalty.dto';
import { ChatRoomSetPasswordDto } from '../dto/chat-room-set-password.dto';
import { ChatRoomUserDto } from '../dto/chat-room-user.dto';
import { ChatUserRoleDto } from '../dto/chat-user-role.dto';
import { AuthGuard } from '../../common/http/guard/auth.guard';

@UseGuards(AuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('room')
  async createRoom(@Body() chatRoomCreationDto: ChatRoomCreationDto) {
    return this.chatService.createRoom(chatRoomCreationDto);
  }

  @Delete('room')
  async deleteRoom(@Body() roomId) {
    return this.chatService.deleteRoom(roomId.roomId);
  }

  @Post('room/join')
  async joinRoom(@Body() chatRoomJoinDto: ChatRoomJoinDto) {
    return this.chatService.joinRoom(chatRoomJoinDto);
  }

  @Post('room/exit')
  async exitRoom(@Body() chatRoomUserDto: ChatRoomUserDto) {
    return this.chatService.exitRoom(chatRoomUserDto);
  }

  @Put('room/password')
  async setRoomPassword(
    @Body() chatRoomSetPasswordDto: ChatRoomSetPasswordDto,
  ) {
    return this.chatService.setRoomPassword(chatRoomSetPasswordDto);
  }

  @Put('room/role')
  async setRole(@Body() chatUserRoleDto: ChatUserRoleDto) {
    return this.chatService.setRole(chatUserRoleDto);
  }

  @Post('room/ban')
  async banUser(@Body() chatRoomPenaltyDto: ChatRoomPenaltyDto) {
    return this.chatService.banUser(chatRoomPenaltyDto);
  }

  @Delete('room/ban')
  async unbanUser(@Body() chatRoomPenaltyDto: ChatRoomPenaltyDto) {
    return this.chatService.unbanUser(chatRoomPenaltyDto);
  }

  @Post('room/mute')
  async muteUser(@Body() chatRoomPenaltyDto: ChatRoomPenaltyDto) {
    return this.chatService.muteUser(chatRoomPenaltyDto);
  }

  @Delete('room/mute')
  async unmuteUser(@Body() chatRoomPenaltyDto: ChatRoomPenaltyDto) {
    return this.chatService.unmuteUser(chatRoomPenaltyDto);
  }

  @Post('room/messages')
  async storeMessages(@Body() chatRoomMessageDto: ChatRoomMessageDto) {
    return this.chatService.storeMessages(chatRoomMessageDto);
  }

  @Get('room/messages')
  async getAllMessages(@Body() roomId: string) {
    return this.chatService.getAllMessages(roomId);
  }
}
