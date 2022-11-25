import {
  RabbitPayload,
  RabbitRequest,
  RabbitRPC,
} from '@golevelup/nestjs-rabbitmq';
import { ChatService } from '../services/chat.service';
import { ChatRoomPenaltyDto } from '../dto/chat-room-penalty.dto';
import { ChatRoomJoinDto } from '../dto/chat-room-join.dto';
import { ChatRoomMessageDto } from '../dto/chat-room-message.dto';
import { ChatRoomCreationDto } from '../dto/chat-room-creation.dto';
import { ChatUserRoleDto } from '../dto/chat-user-role.dto';
import {
  Controller,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RmqErrorHandler } from '../../common/rmq/rmq-error.handler';
import { RmqResponseInterceptor } from '../../common/rmq/interceptors/rmq-response.interceptor';
import { RmqErrorFactory } from '../../common/rmq/rmq-error.factory';
import { AdminGuard, OwnerGuard } from '../guards/role.guard';
import { ChatRoomSetPasswordDto } from '../dto/chat-room-set-password.dto';
import { RoomExistsGuard } from '../guards/room-exists.guard';
import { ChatRoomUserDto } from '../dto/chat-room-user.dto';
import { ChatRoomOwnerCommandDto } from '../dto/chat-room-owner-command.dto';
import { ChatRoomSearchDto } from '../dto/chat-room-search.dto';
import { ChatRoomAccessibilityDto } from '../dto/chat-room-accessibility.dto';
import { ChatRoomAdminCommandDto } from '../dto/chat-room-admin-command.dto';
import { ChatRoomUnpenalizeDto } from '../dto/chat-room-unpenalize.dto';
import { ChatRoomIdDto } from '../dto/chat-room-id.dto';

@UseInterceptors(RmqResponseInterceptor)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,

    exceptionFactory: RmqErrorFactory('chat-service'),
  }),
)
@Controller()
export class ChatRmqController {
  constructor(private readonly chatService: ChatService) {}

  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.create.room.q',
    routingKey: 'req.to.chat.create.room.rk',
    errorHandler: RmqErrorHandler,
  })
  async createRoom(
    @RabbitRequest() req,
    @RabbitPayload() chatRoomCreationDto: ChatRoomCreationDto,
  ) {
    return await this.chatService.createRoom(chatRoomCreationDto);
  }

  @UseGuards(RoomExistsGuard)
  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.get.room.users.q',
    routingKey: 'req.to.chat.get.room.users.rk',
    errorHandler: RmqErrorHandler,
  })
  async getRoomUsers(
    @RabbitRequest() req,
    @RabbitPayload() chatRoomIdDto: ChatRoomIdDto,
  ) {
    return await this.chatService.getRoomUsers(req.room);
  }

  @UseGuards(RoomExistsGuard, OwnerGuard)
  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.delete.room.q',
    routingKey: 'req.to.chat.delete.room.rk',
    errorHandler: RmqErrorHandler,
  })
  async deleteRoom(
    @RabbitRequest() req,
    @RabbitPayload() chatRoomOwnerCommandDto: ChatRoomOwnerCommandDto,
  ) {
    return this.chatService.deleteRoom(req.room);
  }

  @UseGuards(RoomExistsGuard)
  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.join.room.q',
    routingKey: 'req.to.chat.join.room.rk',
    errorHandler: RmqErrorHandler,
  })
  async joinRoom(
    @RabbitRequest() req,
    @RabbitPayload() chatRoomJoinDto: ChatRoomJoinDto,
  ) {
    return this.chatService.joinRoom(req.room, chatRoomJoinDto);
  }

  @UseGuards(RoomExistsGuard)
  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.exit.room.q',
    routingKey: 'req.to.chat.exit.room.rk',
    errorHandler: RmqErrorHandler,
  })
  async exitRoom(
    @RabbitRequest() req,
    @RabbitPayload() chatRoomUserDto: ChatRoomUserDto,
  ) {
    return this.chatService.exitRoom(req.room, chatRoomUserDto);
  }

  @UseGuards(RoomExistsGuard, OwnerGuard)
  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.set.room.password.q',
    routingKey: 'req.to.chat.set.room.password.rk',
    errorHandler: RmqErrorHandler,
  })
  async setRoomPassword(
    @RabbitRequest() req,
    @RabbitPayload() chatRoomSetPasswordDto: ChatRoomSetPasswordDto,
  ) {
    return this.chatService.setRoomPassword(req.room, chatRoomSetPasswordDto);
  }

  @UseGuards(RoomExistsGuard, OwnerGuard)
  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.set.user.role.q',
    routingKey: 'req.to.chat.set.user.role.rk',
    errorHandler: RmqErrorHandler,
  })
  async setRole(
    @RabbitRequest() req,
    @RabbitPayload() chatUserRoleDto: ChatUserRoleDto,
  ) {
    return this.chatService.setRole(req.room, chatUserRoleDto);
  }

  @UseGuards(RoomExistsGuard, AdminGuard)
  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.ban.user.q',
    routingKey: 'req.to.chat.ban.user.rk',
    errorHandler: RmqErrorHandler,
  })
  async banUser(
    @RabbitRequest() req,
    @RabbitPayload() chatRoomPenaltyDto: ChatRoomPenaltyDto,
  ) {
    return this.chatService.banUser(req.room, chatRoomPenaltyDto);
  }

  @UseGuards(RoomExistsGuard, AdminGuard)
  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.unban.user.q',
    routingKey: 'req.to.chat.unban.user.rk',
    errorHandler: RmqErrorHandler,
  })
  async unbanUser(
    @RabbitRequest() req,
    @RabbitPayload() chatRoomUnpenalizeDto: ChatRoomUnpenalizeDto,
  ) {
    return this.chatService.unbanUser(req.room, chatRoomUnpenalizeDto);
  }

  @UseGuards(RoomExistsGuard, AdminGuard)
  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.ban.list.q',
    routingKey: 'req.to.chat.ban.list.rk',
    errorHandler: RmqErrorHandler,
  })
  async getBanlist(
    @RabbitRequest() req,
    @RabbitPayload() chatRoomAdminCommandDto: ChatRoomAdminCommandDto,
  ) {
    return this.chatService.getBanlist(req.room);
  }

  @UseGuards(RoomExistsGuard, AdminGuard)
  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.mute.user.q',
    routingKey: 'req.to.chat.mute.user.rk',
    errorHandler: RmqErrorHandler,
  })
  async muteUser(
    @RabbitRequest() req,
    @RabbitPayload() chatRoomPenaltyDto: ChatRoomPenaltyDto,
  ) {
    return this.chatService.muteUser(req.room, chatRoomPenaltyDto);
  }

  @UseGuards(RoomExistsGuard, AdminGuard)
  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.unmute.user.q',
    routingKey: 'req.to.chat.unmute.user.rk',
    errorHandler: RmqErrorHandler,
  })
  async unmuteUser(
    @RabbitRequest() req,
    @RabbitPayload() chatRoomUnpenalizeDto: ChatRoomUnpenalizeDto,
  ) {
    return this.chatService.unmuteUser(req.room, chatRoomUnpenalizeDto);
  }

  @UseGuards(RoomExistsGuard, AdminGuard)
  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.mute.list.q',
    routingKey: 'req.to.chat.mute.list.rk',
    errorHandler: RmqErrorHandler,
  })
  async getMutelist(
    @RabbitRequest() req,
    @RabbitPayload() chatRoomAdminCommandDto: ChatRoomAdminCommandDto,
  ) {
    return this.chatService.getMutelist(req.room);
  }

  @UseGuards(RoomExistsGuard, OwnerGuard)
  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.set.room.access.q',
    routingKey: 'req.to.chat.set.room.access.rk',
    errorHandler: RmqErrorHandler,
  })
  async setRoomAccessibility(
    @RabbitRequest() req,
    @RabbitPayload() chatRoomAccessibilityDto: ChatRoomAccessibilityDto,
  ) {
    return this.chatService.setRoomAccessibility(
      req.room,
      chatRoomAccessibilityDto,
    );
  }

  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.search.rooms.q',
    routingKey: 'req.to.chat.search.rooms.rk',
    errorHandler: RmqErrorHandler,
  })
  async searchRooms(
    @RabbitRequest() req,
    @RabbitPayload() chatRoomSearchDto: ChatRoomSearchDto,
  ) {
    return this.chatService.searchRooms(chatRoomSearchDto);
  }

  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.search.all.rooms.q',
    routingKey: 'req.to.chat.search.all.rooms.rk',
    errorHandler: RmqErrorHandler,
  })
  async searchAllRooms() {
    return this.chatService.searchAllRooms();
  }

  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.store.room.message.q',
    routingKey: 'req.to.chat.store.room.message.rk',
    errorHandler: RmqErrorHandler,
  })
  async storeRoomMessage(
    @RabbitRequest() req,
    @RabbitPayload() chatRoomMessageDto: ChatRoomMessageDto,
  ) {
    return this.chatService.storeRoomMessage(chatRoomMessageDto);
  }

  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.get.all.room.messages.q',
    routingKey: 'req.to.chat.get.all.room.messages.rk',
    errorHandler: RmqErrorHandler,
  })
  async getAllRoomMessages(
    @RabbitRequest() req,
    @RabbitPayload() chatRoomIdDto: ChatRoomIdDto,
  ) {
    return this.chatService.getAllRoomMessages(chatRoomIdDto);
  }

  @RabbitRPC({
    exchange: 'chat.d.x',
    queue: 'chat.get.joined.rooms.q',
    routingKey: 'req.to.chat.get.joined.rooms.rk',
    errorHandler: RmqErrorHandler,
  })
  async getJoinedRooms(userId: string) {
    return this.chatService.getJoinedRooms(userId);
  }
}
