import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import { ChatRoomCreationDto } from '../dto/chat-room-creation.dto';
import { ChatRoomJoinDto } from '../dto/chat-room-join.dto';
import { ChatRoomMessageDto } from '../dto/chat-room-message.dto';
import { ChatRoomPenaltyDto } from '../dto/chat-room-penalty.dto';
import { ChatRoomSetPasswordDto } from '../dto/chat-room-set-password.dto';
import { ChatUserRoleDto } from '../dto/chat-user-role.dto';
import { AuthGuard } from '../../common/http/guard/auth.guard';
import { ChatRoomAccessibilityDto } from '../dto/chat-room-accessibility.dto';
import { ChatRoomUnpenalizeDto } from '../dto/chat-room-unpenalize.dto';

//TODO: param uuid validation
@UseGuards(AuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('room')
  async createRoom(
    @Req() req,
    @Body() chatRoomCreationDto: ChatRoomCreationDto,
  ) {
    chatRoomCreationDto.room_owner_id = req.user.user_id;
    return this.chatService.createRoom(chatRoomCreationDto);
  }

  @Delete('room/:roomId')
  async deleteRoom(@Req() req, @Param('roomId', new ParseUUIDPipe()) roomId) {
    return this.chatService.deleteRoom({
      room_owner_id: req.user.user_id,
      room_id: roomId,
    });
  }

  @Post('room/:roomId/join')
  async joinRoom(
    @Req() req,
    @Param('roomId', new ParseUUIDPipe()) roomId,
    @Body() chatRoomJoinDto: ChatRoomJoinDto,
  ) {
    chatRoomJoinDto.user_id = req.user.user_id;
    chatRoomJoinDto.room_id = roomId;
    return this.chatService.joinRoom(chatRoomJoinDto);
  }

  @Post('room/:roomId/exit')
  async exitRoom(@Req() req, @Param('roomId', new ParseUUIDPipe()) roomId) {
    return this.chatService.exitRoom({
      user_id: req.user.user_id,
      room_id: roomId,
    });
  }

  @Put('room/:roomId/password')
  async setRoomPassword(
    @Req() req,
    @Param('roomId', new ParseUUIDPipe()) roomId,
    @Body() chatRoomSetPasswordDto: ChatRoomSetPasswordDto,
  ) {
    chatRoomSetPasswordDto.room_owner_id = req.user.user_id;
    chatRoomSetPasswordDto.room_id = roomId;
    return this.chatService.setRoomPassword(chatRoomSetPasswordDto);
  }

  @Put('room/:roomId/role')
  async setRole(
    @Req() req,
    @Param('roomId', new ParseUUIDPipe()) roomId,
    @Body() chatUserRoleDto: ChatUserRoleDto,
  ) {
    chatUserRoleDto.room_owner_id = req.user.user_id;
    chatUserRoleDto.room_id = roomId;
    return this.chatService.setRole(chatUserRoleDto);
  }

  @Post('room/:roomId/ban')
  async banUser(
    @Req() req,
    @Param('roomId', new ParseUUIDPipe()) roomId,
    @Body() chatRoomPenaltyDto: ChatRoomPenaltyDto,
  ) {
    chatRoomPenaltyDto.room_admin_id = req.user.user_id;
    chatRoomPenaltyDto.room_id = roomId;
    return this.chatService.banUser(chatRoomPenaltyDto);
  }

  @Delete('room/:roomId/ban')
  async unbanUser(
    @Req() req,
    @Param('roomId', new ParseUUIDPipe()) roomId,
    @Body() chatRoomUnpenalizeDto: ChatRoomUnpenalizeDto,
  ) {
    chatRoomUnpenalizeDto.room_admin_id = req.user.user_id;
    chatRoomUnpenalizeDto.room_id = roomId;
    return this.chatService.unbanUser(chatRoomUnpenalizeDto);
  }

  @Get('room/:roomId/ban')
  async getBanList(@Req() req, @Param('roomId', new ParseUUIDPipe()) roomId) {
    return this.chatService.getBanList({
      room_admin_id: req.user.user_id,
      room_id: roomId,
    });
  }

  @Post('room/:roomId/mute')
  async muteUser(
    @Req() req,
    @Param('roomId', new ParseUUIDPipe()) roomId,
    @Body() chatRoomPenaltyDto: ChatRoomPenaltyDto,
  ) {
    chatRoomPenaltyDto.room_admin_id = req.user.user_id;
    chatRoomPenaltyDto.room_id = roomId;
    return this.chatService.muteUser(chatRoomPenaltyDto);
  }

  @Delete('room/:roomId/mute')
  async unmuteUser(
    @Req() req,
    @Param('roomId', new ParseUUIDPipe()) roomId,
    @Body() chatRoomUnpenalizeDto: ChatRoomUnpenalizeDto,
  ) {
    chatRoomUnpenalizeDto.room_admin_id = req.user.user_id;
    chatRoomUnpenalizeDto.room_id = roomId;
    return this.chatService.unmuteUser(chatRoomUnpenalizeDto);
  }

  @Get('room/:roomId/mute')
  async getMuteList(@Req() req, @Param('roomId', new ParseUUIDPipe()) roomId) {
    return this.chatService.getMuteList({
      room_admin_id: req.user.user_id,
      room_id: roomId,
    });
  }

  @Post('room/:roomId/messages')
  async storeMessages(
    @Req() req,
    @Param('roomId', new ParseUUIDPipe()) roomId,
    @Body() chatRoomMessageDto: ChatRoomMessageDto,
  ) {
    chatRoomMessageDto.room_id = roomId;
    return this.chatService.storeMessages(chatRoomMessageDto);
  }

  @Get('room/:roomId/messages')
  async getAllMessages(
    @Req() req,
    @Param('roomId', new ParseUUIDPipe()) roomId,
  ) {
    return this.chatService.getAllMessages(roomId);
  }

  @Put('room/:roomId/access')
  async setRoomAccessibility(
    @Req() req,
    @Param('roomId', new ParseUUIDPipe()) roomId,
    @Body() chatRoomAccessibilityDto: ChatRoomAccessibilityDto,
  ) {
    chatRoomAccessibilityDto.room_owner_id = req.user.user_id;
    chatRoomAccessibilityDto.room_id = roomId;
    return this.chatService.setRoomAccessibility(chatRoomAccessibilityDto);
  }

  @Get('rooms')
  async searchRooms(@Req() req, @Query('room-name') roomName: string) {
    return this.chatService.searchRooms(roomName);
  }

  @Get('rooms/all')
  async searchAllRooms(@Req() req) {
    return this.chatService.searchAllRooms();
  }
}
