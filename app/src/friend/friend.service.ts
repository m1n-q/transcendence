import { RmqError } from 'src/common/rmq-module/types/rmq-error';
import { Friend } from '../common/entities/Friend';
import { FriendRequest } from '../common/entities/Friend_request';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  RmqRequestFriend,
  RmqDeleteFriend,
  RmqCancelFriendRequest,
  RmqAcceptFriendRequest,
  RmqRejectFriendRequest,
  RmqUserId,
} from './dto/rmq.friend.request';
import { DataSource, Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { FriendInfo } from './friend-info';
import { UserService } from 'src/user/user.service';

const WHERE = 'user_service';

@Injectable()
export class FriendService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    private readonly userService: UserService,
    private dataSource: DataSource,
  ) {}

  isSameId(request: string, receive: string): boolean {
    if (request === receive) {
      return true;
    }
    return false;
  }

  async readFriend(payload: RmqUserId) {
    let friendList;
    try {
      friendList = await this.friendRepository.find({
        where: [{ requester: payload.user_id }, { receiver: payload.user_id }],
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    if (friendList.length === 0) {
      throw new RmqError({
        code: 404,
        message: 'Not found list',
        where: `${WHERE}#readFriend()`,
      });
    }
    const friendIdList = [];
    Object.values(friendList).map((item: FriendInfo) => {
      if (item.requester === payload.user_id) friendIdList.push(item.receiver);
      else friendIdList.push(item.requester);
    });
    return this.userService.readUserListById(friendIdList);
  }

  async deleteFriend(payload: RmqDeleteFriend) {
    if (this.isSameId(payload.user_id, payload.friend_id)) {
      throw new RmqError({
        code: 409,
        message: 'same id',
        where: `${WHERE}#deleteFriend()`,
      });
    }
    let findFriend;
    try {
      findFriend = await this.friendRepository.findOne({
        where: [
          { requester: payload.user_id, receiver: payload.friend_id },
          { requester: payload.friend_id, receiver: payload.user_id },
        ],
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    if (!findFriend) {
      throw new RmqError({
        code: 404,
        message: 'not found friend',
        where: `${WHERE}#deleteFriend()`,
      });
    }
    try {
      await this.friendRepository.remove(findFriend);
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
  }

  async readSentFriendRequest(payload: RmqUserId) {
    let friendRequestList;
    try {
      friendRequestList = await this.friendRequestRepository.find({
        where: { requester: payload.user_id },
        relations: { receiver_info: true },
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    if (friendRequestList.length === 0) {
      throw new RmqError({
        code: 404,
        message: 'Not found list',
        where: `${WHERE}#readSentFriendRequest()`,
      });
    }
    const reFormattingList = friendRequestList.map((request) => {
      const user_info = this.deleteUserInfo(request.receiver_info);
      delete request.receiver_info;
      delete request.receiver;
      delete request.requester;
      request['user_info'] = user_info;
      return request;
    });
    return reFormattingList;
  }

  async readRecvFriendRequest(payload: RmqUserId) {
    let friendRequestList;
    try {
      friendRequestList = await this.friendRequestRepository.find({
        where: { receiver: payload.user_id },
        relations: { requester_info: true },
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    if (friendRequestList.length === 0) {
      throw new RmqError({
        code: 404,
        message: 'Not found list',
        where: `${WHERE}#readRecvFriendRequest()`,
      });
    }
    const reFormattingList = friendRequestList.map((request) => {
      const user_info = this.deleteUserInfo(request.requester_info);
      delete request.requester_info;
      delete request.receiver;
      delete request.requester;
      request['user_info'] = user_info;
      return request;
    });
    return reFormattingList;
  }

  async createFriendRequest(payload: RmqRequestFriend): Promise<any> {
    if (this.isSameId(payload.requester, payload.receiver)) {
      throw new RmqError({
        code: 409,
        message: 'same id',
        where: `${WHERE}#createFriendRequest()`,
      });
    }

    let findFriend;
    try {
      findFriend = await this.friendRepository.findOne({
        where: [
          { requester: payload.requester, receiver: payload.receiver },
          { requester: payload.receiver, receiver: payload.requester },
        ],
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    if (findFriend) {
      throw new RmqError({
        code: 409,
        message: 'already friend',
        where: `${WHERE}#createFriendRequest()`,
      });
    }

    let findFriendRequest;
    try {
      findFriendRequest = await this.friendRequestRepository.findOne({
        where: [
          { requester: payload.requester, receiver: payload.receiver },
          { requester: payload.receiver, receiver: payload.requester },
        ],
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    if (findFriendRequest) {
      throw new RmqError({
        code: 409,
        message: 'already request',
        where: `${WHERE}#createFriendRequest()`,
      });
    }

    const friendRequest = this.friendRequestRepository.create(payload);

    try {
      await this.friendRequestRepository.save(friendRequest);
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    //notification
    try {
      this.amqpConnection.publish(
        'user.t.x',
        'event.on.user.friend-request.rk',
        {
          recvUsers: [payload.receiver],
          data: { sender: payload.requester, payload: '' },
          created: Date.now(),
        },
      );
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `Rmq publish Error : ${e}`,
        where: `${WHERE}#createFriendRequest()`,
      });
    }
    return friendRequest;
  }

  async cancelFriendRequest(payload: RmqCancelFriendRequest) {
    let findFriendRequest;
    try {
      findFriendRequest = await this.friendRequestRepository.findOne({
        where: { request_id: payload.request_id },
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }

    if (
      !findFriendRequest ||
      findFriendRequest.requester !== payload.requester
    ) {
      throw new RmqError({
        code: 409,
        message: 'not found request',
        where: `${WHERE}#cancelFriendRequest()`,
      });
    }

    try {
      await this.friendRequestRepository.remove(findFriendRequest);
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
  }

  async acceptFriendRequest(payload: RmqAcceptFriendRequest): Promise<any> {
    let findFriendRequest;
    try {
      findFriendRequest = await this.friendRequestRepository.findOne({
        where: { request_id: payload.request_id },
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }

    if (!findFriendRequest || findFriendRequest.receiver !== payload.receiver) {
      throw new RmqError({
        code: 409,
        message: 'Not found request',
        where: `${WHERE}#acceptFriendRequest()`,
      });
    }

    const friend = this.friendRepository.create({
      requester: findFriendRequest.requester,
      receiver: findFriendRequest.receiver,
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.remove(findFriendRequest);
      await queryRunner.manager.save(friend);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new RmqError({
        code: 409,
        message: 'Conflict',
        where: `${WHERE}#acceptFriendRequest()`,
      });
    } finally {
      await queryRunner.release();
    }

    return friend;
  }

  async rejectFriendRequest(payload: RmqRejectFriendRequest) {
    let findFriendRequest;
    try {
      findFriendRequest = await this.friendRequestRepository.findOne({
        where: { request_id: payload.request_id },
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    if (!findFriendRequest || findFriendRequest.receiver !== payload.receiver) {
      throw new RmqError({
        code: 409,
        message: 'not found request',
        where: `${WHERE}#rejectFriendRequest()`,
      });
    }

    try {
      await this.friendRequestRepository.remove(findFriendRequest);
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
  }

  deleteUserInfo(user) {
    delete user.provider;
    delete user.third_party_id;
    delete user.two_factor_authentication_key;
    delete user.two_factor_authentication_type;
    delete user.deleted;
    user.created = user.created.toString();
    return user;
  }
}
