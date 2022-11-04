import { BlackList } from '../common/entities/Block';
import { RmqError } from 'src/common/rmq-module/types/rmq-error';
import { Friend } from '../common/entities/Friend';
import { UserService } from './../user/user.service';
import { FriendRequest } from '../common/entities/Friend_request';
import { User } from '../common/entities/User';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  RmqRequestFriend,
  RmqRequestFriendId,
  RmqRequestBlockFriend,
} from './dto/rmq.friend.request';
import { DataSource, Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

const WHERE = 'user_service';

@Injectable()
export class FriendService {
  constructor(
    private readonly amqpConnection: AmqpConnection,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    @InjectRepository(BlackList)
    private blackListRepository: Repository<BlackList>,
    private readonly userService: UserService,
    private dataSource: DataSource,
  ) {}

  isSameId(request: string, receive: string): boolean {
    if (request === receive) {
      return true;
    }
    return false;
  }

  async createFriendRequest(payload: RmqRequestFriend) {
    if (this.isSameId(payload.requester, payload.receiver)) {
      throw new RmqError({
        code: 409,
        message: 'same id',
        where: `${WHERE}#createFriendRequest()`,
      });
    }
    await this.userService.readUserById({ user_id: payload.receiver });

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
          payload: `${payload.requester} has requested a friend.`,
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

  async readFriendRequest(payload: RmqRequestFriendId) {
    let friendList;
    try {
      friendList = await this.friendRequestRepository.find({
        where: { requester: payload.user_id },
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
        where: `${WHERE}#readFriendRequest()`,
      });
    }
    return friendList;
  }

  async deleteFriendRequest(payload: RmqRequestFriend) {
    if (this.isSameId(payload.requester, payload.receiver)) {
      throw new RmqError({
        code: 409,
        message: 'same id',
        where: `${WHERE}#deleteFriendRequest()`,
      });
    }
    await this.userService.readUserById({ user_id: payload.receiver });

    let findFriendRequest;
    try {
      findFriendRequest = await this.friendRequestRepository.findOne({
        where: { requester: payload.requester, receiver: payload.receiver },
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }

    if (!findFriendRequest) {
      throw new RmqError({
        code: 409,
        message: 'not found request',
        where: `${WHERE}#deleteFriendRequest()`,
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

  async createBlockFriend(payload: RmqRequestBlockFriend) {
    if (this.isSameId(payload.blocker, payload.blocked)) {
      throw new RmqError({
        code: 409,
        message: 'same id',
        where: `${WHERE}#createBlockFriend()`,
      });
    }
    await this.userService.readUserById({ user_id: payload.blocked });

    let blackList;
    try {
      blackList = await this.blackListRepository.findOne({
        where: { blocker: payload.blocker, blocked: payload.blocked },
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    if (blackList) {
      throw new RmqError({
        code: 409,
        message: 'already request',
        where: `${WHERE}#createBlockFriend()`,
      });
    }

    const blockFriend = this.blackListRepository.create(payload);

    try {
      await this.blackListRepository.save(blockFriend);
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    return blockFriend;
  }

  async readBlockFriend(payload: RmqRequestFriendId) {
    let blackList;
    try {
      blackList = await this.blackListRepository.find({
        where: { blocker: payload.user_id },
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    if (blackList.length === 0) {
      throw new RmqError({
        code: 404,
        message: 'Not found list',
        where: `${WHERE}#readBlockFriend()`,
      });
    }
    return blackList;
  }

  async deleteBlockFriend(payload: RmqRequestBlockFriend) {
    if (this.isSameId(payload.blocker, payload.blocked)) {
      throw new RmqError({
        code: 409,
        message: 'same id',
        where: `${WHERE}#deleteBlockFriend()`,
      });
    }
    await this.userService.readUserById({ user_id: payload.blocked });

    let findBlackList;
    try {
      findBlackList = await this.blackListRepository.findOne({
        where: { blocker: payload.blocker, blocked: payload.blocked },
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }

    if (!findBlackList) {
      throw new RmqError({
        code: 409,
        message: 'not found request',
        where: `${WHERE}#deleteBlockFriend()`,
      });
    }

    try {
      await this.blackListRepository.remove(findBlackList);
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
  }

  async createFriend(payload: RmqRequestFriend) {
    let findFriendRequest;
    try {
      findFriendRequest = await this.friendRequestRepository.findOne({
        where: { requester: payload.requester, receiver: payload.receiver },
      });
    } catch (e) {
      throw new RmqError({
        code: 500,
        message: `DB Error : ${e}`,
        where: WHERE,
      });
    }
    if (!findFriendRequest) {
      throw new RmqError({
        code: 409,
        message: 'Not found request',
        where: `${WHERE}#createFriend()`,
      });
    }

    const friend = this.friendRepository.create({
      requester: payload.requester,
      receiver: payload.receiver,
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
        where: `${WHERE}#createFriend()`,
      });
    } finally {
      await queryRunner.release();
    }

    return friend;
  }

  async readFriend(payload: RmqRequestFriendId) {
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
    return friendList;
  }

  async deleteFriend(payload: RmqRequestFriend) {
    if (this.isSameId(payload.requester, payload.receiver)) {
      throw new RmqError({
        code: 409,
        message: 'same id',
        where: `${WHERE}#deleteFriend()`,
      });
    }

    await this.userService.readUserById({ user_id: payload.receiver });

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

    if (!findFriend) {
      throw new RmqError({
        code: 409,
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
}
