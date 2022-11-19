import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Not, Repository } from 'typeorm';
import { ChatRoomMessage } from '../../common/entities/chat-room-message.entity';
import {
  ChatRoom,
  ChatRoomAccess,
} from '../../common/entities/chat-room.entity';
import { ChatRoomUser } from '../../common/entities/chat-room-user.entity';
import { ChatRoomPenaltyDto } from '../dto/chat-room-penalty.dto';
import { ChatRoomJoinDto } from '../dto/chat-room-join.dto';
import { ChatRoomCreationDto } from '../dto/chat-room-creation.dto';
import { ChatRoomMessageDto } from '../dto/chat-room-message.dto';
import { ChatUserRoleDto } from '../dto/chat-user-role.dto';
import { ChatRoomBanList } from '../../common/entities/chat-room-ban-list.entity';
import { ChatRoomMuteList } from '../../common/entities/chat-room-mute-list.entity';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import { RmqError } from '../../common/rmq/types/rmq-error';
import { ChatRoomSetPasswordDto } from '../dto/chat-room-set-password.dto';
import { ChatRoomUserDto } from '../dto/chat-room-user.dto';
import { toRmqError } from '../../common/rmq/errors/to-rmq-error';
import { UserNotInScopeError } from '../../common/rmq/errors/user-not-in-room.error';
import { OwnerPrivileageError } from '../../common/rmq/errors/owner-privileage.error';
import { ChatRoomSearchDto } from '../dto/chat-room-search.dto';
import { ChatRoomAccessibilityDto } from '../dto/chat-room-accessibility.dto';
import { ChatRoomUnpenalizeDto } from '../dto/chat-room-unpenalize.dto';

/*  TODO:
 *
 * distributed DB?
 * cron-job on ban/mute list?
 * 초대 기능
 */

@Injectable()
export class ChatService {
  static readonly SALT = 10;

  constructor(
    private readonly dbConnection: DataSource,
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepo: Repository<ChatRoom>,
    @InjectRepository(ChatRoomMessage)
    private readonly chatRoomMessageRepo: Repository<ChatRoomMessage>,
    @InjectRepository(ChatRoomUser)
    private readonly chatRoomUserRepo: Repository<ChatRoomUser>,
    @InjectRepository(ChatRoomBanList)
    private readonly chatRoomBanListRepo: Repository<ChatRoomBanList>,
    @InjectRepository(ChatRoomMuteList)
    private readonly chatRoomMuteListRepo: Repository<ChatRoomMuteList>,
  ) {}

  async findRoom(roomId: string) {
    const room = await this.chatRoomRepo.findOneBy({
      roomId,
    });
    return room;
  }

  async isOwner(userId, roomOrId: ChatRoom | string) {
    let room: ChatRoom;

    if (typeof roomOrId === 'string') room = await this.findRoom(roomOrId);
    else room = roomOrId;
    return room !== null && room.roomOwnerId === userId;
  }

  async isAdmin(userId, roomOrId: ChatRoom | string) {
    let room: ChatRoom;
    if (typeof roomOrId === 'string') room = await this.findRoom(roomOrId);
    else room = roomOrId;

    let userInRoom;
    if (room) {
      userInRoom = await this.chatRoomUserRepo.findOneBy({
        roomId: room.roomId,
        userId,
      });
    }
    return userInRoom !== null && userInRoom.role === 'admin';
  }

  getExpiry(seconds) {
    return moment(Date.now()).add(seconds, 's').toDate();
  }

  async searchRooms(chatRoomSearchDto: ChatRoomSearchDto) {
    let rooms: ChatRoom[];
    try {
      rooms = await this.chatRoomRepo.findBy({
        roomAccess: Not(ChatRoomAccess.PRIVATE),
        roomName: Like(`%${chatRoomSearchDto.room_name}%`),
      });
    } catch (e) {
      throw toRmqError(e);
    }

    return {
      rooms: rooms.map((room) => {
        return {
          room_id: room.roomId,
          room_name: room.roomName,
          room_owner_id: room.roomOwnerId,
          room_access: room.roomAccess,
          created: room.created,
        };
      }),
    };
  }

  async searchAllRooms() {
    let rooms: ChatRoom[];
    try {
      rooms = await this.chatRoomRepo.findBy({
        roomAccess: Not(ChatRoomAccess.PRIVATE),
      });
    } catch (e) {
      throw toRmqError(e);
    }

    return {
      rooms: rooms.map((room) => {
        return {
          room_id: room.roomId,
          room_name: room.roomName,
          room_owner_id: room.roomOwnerId,
          room_access: room.roomAccess,
          created: room.created,
        };
      }),
    };
  }

  async createRoom(chatRoomCreationDto: ChatRoomCreationDto) {
    const {
      room_name: roomName,
      room_owner_id: roomOwnerId,
      room_access: roomAccess,
      room_password: roomPassword,
    } = chatRoomCreationDto;

    if (roomAccess === 'protected') {
      if (!roomPassword)
        throw new RmqError({
          code: 400,
          message: `cannot create ${roomAccess} room without password`,
          where: 'chat-service',
        });
    } else {
      if (roomPassword)
        throw new RmqError({
          code: 400,
          message: `cannot create ${roomAccess} room with password`,
          where: 'chat-service',
        });
    }

    let hashedRoomPassword = null;
    if (roomPassword)
      hashedRoomPassword = bcrypt.hashSync(roomPassword, ChatService.SALT);

    let roomId;
    const q = this.dbConnection.createQueryRunner();
    q.startTransaction();
    try {
      const roomResult = await q.manager.insert(ChatRoom, {
        roomName,
        roomOwnerId,
        roomAccess,
        roomPassword: hashedRoomPassword,
      });
      roomId = roomResult['identifiers'][0]['roomId'];
      await q.manager.insert(ChatRoomUser, {
        roomId,
        userId: roomOwnerId,
        role: 'admin',
      });
      await q.commitTransaction();
    } catch (e) {
      await q.rollbackTransaction();
      throw toRmqError(e);
    } finally {
      await q.release();
    }
    return { room_id: roomId };
  }

  //XXX: RoomExistsGuard, OwnerGuard
  //NOTE: now on delete room, CASCADE room-users. what if on distributed-DB? */
  async deleteRoom(room: ChatRoom) {
    try {
      await this.chatRoomRepo.remove(room);
    } catch (e) {
      throw toRmqError(e);
    }
    /* if room not exists, cannot reach here. always return 1 */
    return { affected: 1 };
  }

  //XXX: RoomExistsGuard
  async joinRoom(room: ChatRoom, chatRoomJoinDto: ChatRoomJoinDto) {
    const {
      room_id: roomId,
      user_id: userId,
      room_password: roomPassword,
    } = chatRoomJoinDto;

    /* TODO: if banned, reject TEST */
    const bannedUser = await this.chatRoomBanListRepo.findOneBy({
      roomId,
      userId,
    });
    if (bannedUser)
      throw new RmqError({
        code: 401,
        message: 'banned user',
        where: 'chat-service',
      });

    if (room.roomAccess == 'protected') {
      const matches = bcrypt.compareSync(roomPassword, room.roomPassword);
      if (!matches)
        throw new RmqError({
          code: 401,
          message: 'invalid password',
          where: 'chat-service',
        });
    }

    try {
      await this.chatRoomUserRepo.insert({ roomId, userId });
    } catch (e) {
      throw toRmqError(e);
    }
    return { room_id: roomId, user_id: userId };
  }

  //XXX: RoomExistsGuard
  async exitRoom(room: ChatRoom, chatRoomUserDto: ChatRoomUserDto) {
    const { user_id: userId, room_id: roomId } = chatRoomUserDto;
    const q = this.dbConnection.createQueryRunner();
    let affected;
    await q.startTransaction();
    try {
      /* remove user from room-user list */
      ({ affected } = await q.manager.delete(ChatRoomUser, {
        roomId,
        userId,
      }));

      /* If user was owner, need to set new owner */
      if (userId === room.roomOwnerId) {
        let candidate;
        if (
          (candidate = await q.manager.findOneBy(ChatRoomUser, {
            roomId: room.roomId,
            role: 'admin',
          })) ||
          (candidate = await q.manager.findOneBy(ChatRoomUser, {
            roomId: room.roomId,
            role: 'user',
          }))
        ) {
          room.roomOwnerId = candidate.userId;
          candidate.role = 'admin';
          await q.manager.save(ChatRoom, room);
          await q.manager.save(ChatRoomUser, candidate);
        } else {
          /* If user was last (should be owner) */
          await q.manager.remove(ChatRoom, room);
        }
      }
      await q.commitTransaction();
    } catch (e) {
      await q.rollbackTransaction();
      throw toRmqError(e);
    } finally {
      await q.release();
    }
    return { affected };
  }

  //XXX: RoomExistsGuard, OwnerGuard
  async setRoomPassword(
    room: ChatRoom,
    chatRoomSetPasswordDto: ChatRoomSetPasswordDto,
  ) {
    const { room_password: roomPassword } = chatRoomSetPasswordDto;

    /* if room is private, doesn't need password */
    if (room.roomAccess == 'private')
      throw new RmqError({
        code: 400,
        message: 'cannot set room password to private room',
        where: 'chat-service',
      }); // 혹은, protected || public으로 전환된다는 메세지 출력

    let newAccess: ChatRoomAccess;
    let hashedPassword;

    if (!roomPassword) {
      newAccess = ChatRoomAccess.PUBLIC;
      hashedPassword = null;
    } else {
      newAccess = ChatRoomAccess.PROTECTED;
      hashedPassword = bcrypt.hashSync(roomPassword, ChatService.SALT);
    }

    let affected;
    try {
      ({ affected } = await this.chatRoomRepo.update(room.roomId, {
        roomPassword: hashedPassword,
        roomAccess: newAccess,
      }));
    } catch (e) {
      throw toRmqError(e);
    }
    return { affected };
  }

  async setRoomAccessibility(
    room: ChatRoom,
    chatRoomAccessibilityDto: ChatRoomAccessibilityDto,
  ) {
    if (room.roomAccess === ChatRoomAccess.PROTECTED)
      throw new RmqError({
        code: 400,
        message: 'cannot set accessibility of protected room',
        where: 'chat-service',
      });
    if (chatRoomAccessibilityDto.room_access === ChatRoomAccess.PROTECTED)
      throw new RmqError({
        code: 400,
        message: 'cannot set accessibility to protected',
        where: 'chat-service',
      });

    room.roomAccess = chatRoomAccessibilityDto.room_access;
    try {
      await this.chatRoomRepo.save(room);
    } catch (e) {
      throw toRmqError(e);
    }
    return { affected: 1 };
  }

  //XXX: RoomExistsGuard, OwnerGuard
  async setRole(room: ChatRoom, chatUserRoleDto: ChatUserRoleDto) {
    /* if owner try to set role itself, reject */
    if (chatUserRoleDto.user_id === room.roomOwnerId)
      throw new RmqError({
        code: 400,
        message: "cannot change owner's role",
        where: 'chat-service',
      });

    /* if user not in room, reject */
    const userInRoom = await this.chatRoomUserRepo.findOneBy({
      roomId: room.roomId,
      userId: chatUserRoleDto.user_id,
    });
    if (!userInRoom) throw new UserNotInScopeError();

    userInRoom.role = chatUserRoleDto.role;
    try {
      await this.chatRoomUserRepo.save(userInRoom);
    } catch (e) {
      throw toRmqError(e);
    }
    return { affected: 1 };
  }

  //XXX: RoomExistsGuard, AdminGuard
  async banUser(room: ChatRoom, chatRoomPenaltyDto: ChatRoomPenaltyDto) {
    const {
      user_id: userId,
      room_admin_id: roomAdminId,
      room_id: roomId,
      time_amount_in_seconds,
    } = chatRoomPenaltyDto;

    const q = this.dbConnection.createQueryRunner();
    await q.startTransaction();
    try {
      /* if user not in room, reject */
      const userInRoom = await q.manager.findOneBy(ChatRoomUser, {
        roomId: room.roomId,
        userId,
      });

      if (!userInRoom) throw new UserNotInScopeError();

      /* if user is admin, only owner is able to ban */
      const userRole = userInRoom.role;
      if (userRole == 'admin' && roomAdminId !== room.roomOwnerId)
        throw new OwnerPrivileageError();

      /* remove from room-user */
      await q.manager.remove(ChatRoomUser, userInRoom);

      /* add to ban-list */
      await q.manager.insert(ChatRoomBanList, {
        roomId,
        userId,
        role: userRole,
        expiry: this.getExpiry(time_amount_in_seconds),
      });
      await q.commitTransaction();
    } catch (e) {
      await q.rollbackTransaction();
      throw e instanceof RmqError ? e : toRmqError(e);
    } finally {
      await q.release();
    }

    return { affected: 1 };
  }

  //XXX: RoomExistsGuard, AdminGuard
  async unbanUser(
    room: ChatRoom,
    chatRoomUnpenalizeDto: ChatRoomUnpenalizeDto,
  ) {
    const {
      room_admin_id: roomAdminId,
      user_id: userId,
      room_id: roomId,
    } = chatRoomUnpenalizeDto;

    const q = this.dbConnection.createQueryRunner();
    await q.startTransaction();
    try {
      const bannedUser = await q.manager.findOneBy(ChatRoomBanList, {
        roomId,
        userId,
      });
      if (!bannedUser) throw new UserNotInScopeError();

      /* only owner is able to unban admin */
      if (bannedUser.role == 'admin' && roomAdminId !== room.roomOwnerId)
        throw new OwnerPrivileageError();

      /* remove from ban-list */
      await q.manager.remove(ChatRoomBanList, bannedUser);
      await q.commitTransaction();
    } catch (e) {
      await q.rollbackTransaction();
      throw e instanceof RmqError ? e : toRmqError(e);
    } finally {
      await q.release();
    }

    return { affected: 1 };
  }

  //XXX: RoomExistsGuard, AdminGuard
  async getBanlist(room: ChatRoom) {
    let list: ChatRoomBanList[];
    try {
      list = await this.chatRoomBanListRepo.findBy({
        roomId: room.roomId,
      });
    } catch (e) {
      throw toRmqError(e);
    }
    return {
      banned: list.map((banned) => {
        return { user_id: banned.userId, expiry: banned.expiry };
      }),
    };
  }

  //XXX: RoomExistsGuard, AdminGuard
  async muteUser(room: ChatRoom, chatRoomPenaltyDto: ChatRoomPenaltyDto) {
    const {
      user_id: userId,
      room_admin_id: roomAdminId,
      room_id: roomId,
      time_amount_in_seconds,
    } = chatRoomPenaltyDto;

    const q = this.dbConnection.createQueryRunner();
    await q.startTransaction();
    try {
      /* if user not in room, reject */
      const userInRoom = await q.manager.findOneBy(ChatRoomUser, {
        roomId: room.roomId,
        userId: userId,
      });
      if (!userInRoom) throw new UserNotInScopeError();

      /* if user is admin, only owner is able to mute */
      const userRole = userInRoom.role;
      if (userRole == 'admin' && roomAdminId !== room.roomOwnerId)
        throw new OwnerPrivileageError();

      /* add to mute-list */
      await q.manager.insert(ChatRoomMuteList, {
        roomId,
        userId,
        role: userRole,
        expiry: this.getExpiry(time_amount_in_seconds),
      });
      await q.commitTransaction();
    } catch (e) {
      await q.rollbackTransaction();
      throw e instanceof RmqError ? e : toRmqError(e);
    } finally {
      await q.release();
    }
    return { affected: 1 };
  }

  //XXX: RoomExistsGuard, AdminGuard
  async unmuteUser(
    room: ChatRoom,
    chatRoomUnpenalizeDto: ChatRoomUnpenalizeDto,
  ) {
    const {
      room_admin_id: roomAdminId,
      user_id: userId,
      room_id: roomId,
    } = chatRoomUnpenalizeDto;

    const q = this.dbConnection.createQueryRunner();
    await q.startTransaction();
    try {
      /* if user not in mute-list, reject */
      const mutedUser = await q.manager.findOneBy(ChatRoomMuteList, {
        roomId: roomId,
        userId: userId,
      });
      if (!mutedUser) throw new UserNotInScopeError();

      /* only owner is able to unban admin  */
      if (mutedUser.role == 'admin' && roomAdminId !== room.roomOwnerId)
        throw new OwnerPrivileageError();

      /* remove from mute-list */
      await q.manager.remove(ChatRoomMuteList, mutedUser);
      await q.commitTransaction();
    } catch (e) {
      await q.rollbackTransaction();
      throw e instanceof RmqError ? e : toRmqError(e);
    } finally {
      await q.release();
    }
    return { affected: 1 };
  }

  //XXX: RoomExistsGuard, AdminGuard
  async getMutelist(room: ChatRoom) {
    let list: ChatRoomMuteList[];
    try {
      list = await this.chatRoomMuteListRepo.findBy({
        roomId: room.roomId,
      });
    } catch (e) {
      throw toRmqError(e);
    }
    return {
      muted: list.map((muted) => {
        return { user_id: muted.userId, expiry: muted.expiry };
      }),
    };
  }

  async storeRoomMessage(chatRoomMessageDto: ChatRoomMessageDto) {
    const { room_id: roomId, message } = chatRoomMessageDto;

    const muted = await this.chatRoomMuteListRepo.findOneBy({
      roomId,
      userId: message.sender_id,
    });
    if (muted)
      throw new RmqError({
        code: 401,
        message: 'muted user',
        where: 'chat-service',
      });

    const result = await this.chatRoomMessageRepo.save(message);
    return {
      message: {
        room_msg_id: result.roomMsgId,
        room_id: result.roomId,
        sender_id: result.senderId,
        payload: result.payload,
        created: result.created,
      },
    };
  }

  async getAllRoomMessages(roomId: string) {
    const room = await this.chatRoomRepo.findOne({
      where: {
        roomId,
      },
      relations: ['messages'],
    });

    return {
      messages: room.messages.map((message) => {
        return {
          room_msg_id: message.roomMsgId,
          sender_id: message.senderId,
          room_id: message.roomId,
          payload: message.payload,
          created: message.created,
        };
      }),
    };
  }

  async getJoinedRooms(userId: string) {
    const userInRooms = await this.chatRoomUserRepo.find({
      where: {
        userId,
      },
      relations: ['room'],
    });

    return {
      rooms: userInRooms.map((userInRoom) => {
        const room = userInRoom.room;
        return {
          room_id: room.roomId,
          room_name: room.roomName,
          room_owner_id: room.roomOwnerId,
          room_access: room.roomAccess,
          created: room.created,
        };
      }),
    };
  }
}
