import { BlackList } from '../common/entities/Black_list';
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
  // 한줄로 사용하고 싶으면 함수 이름에 validate 같은?
  // 함수 이름에 맞게 bool 리턴 후 각 함수에서 throw해주는 것이 좋을 듯
  isSameId(request: string, receive: string): boolean {
    if (request === receive) {
      return true;
    }
    return false;
  }

  async createFriendRequest(payload: RmqRequestFriend) {
    if (this.isSameId(payload.requester, payload.receiver)) {
      throw new RmqError(409, 'same id', WHERE);
    }
    await this.userService.readUserById({ id: payload.receiver });

    let findFriend;
    try {
      findFriend = await this.friendRepository.findOne({
        where: [
          { requester: payload.requester, receiver: payload.receiver },
          { requester: payload.receiver, receiver: payload.requester },
        ],
      });
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
    if (findFriend) {
      throw new RmqError(409, 'already friend', WHERE);
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
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
    if (findFriendRequest) {
      throw new RmqError(409, 'already request', WHERE);
    }

    const friendRequest = this.friendRequestRepository.create(payload);

    try {
      await this.friendRequestRepository.save(friendRequest);
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
    //notification
    this.amqpConnection.publish('user.t.x', 'event.on.user.friend-request.rk', {
      recvUsers: [payload.receiver],
      payload: `${payload.requester} has requested a friend.`,
      created: Date.now(),
    });
    return friendRequest;
  }

  async readFriendRequest(payload: RmqRequestFriendId) {
    let friendList;
    try {
      friendList = await this.friendRequestRepository.find({
        where: { requester: payload.userId },
      });
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
    if (friendList.length === 0) {
      throw new RmqError(404, 'Not found list', WHERE);
    }
    return friendList;
  }

  async deleteFriendRequest(payload: RmqRequestFriend) {
    if (this.isSameId(payload.requester, payload.receiver)) {
      throw new RmqError(409, 'same id', WHERE);
    }
    await this.userService.readUserById({ id: payload.receiver });

    let findFriendRequest;
    try {
      findFriendRequest = await this.friendRequestRepository.findOne({
        where: { requester: payload.requester, receiver: payload.receiver },
      });
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }

    if (!findFriendRequest) {
      throw new RmqError(409, 'not found request', WHERE);
    }

    try {
      await this.friendRequestRepository.remove(findFriendRequest);
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
  }

  async createBlockFriend(payload: RmqRequestBlockFriend) {
    if (this.isSameId(payload.blocker, payload.blocked)) {
      throw new RmqError(409, 'same id', WHERE);
    }
    await this.userService.readUserById({ id: payload.blocked });

    let blackList;
    try {
      blackList = await this.blackListRepository.findOne({
        where: { blocker: payload.blocker, blocked: payload.blocked },
      });
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
    if (blackList) {
      throw new RmqError(409, 'already request', WHERE);
    }

    const blockFriend = this.blackListRepository.create(payload);

    try {
      await this.blackListRepository.save(blockFriend);
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
    return blockFriend;
  }

  async readBlockFriend(payload: RmqRequestFriendId) {
    let blackList;
    try {
      blackList = await this.blackListRepository.find({
        where: { blocker: payload.userId },
      });
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
    if (blackList.length === 0) {
      throw new RmqError(404, 'Not found list', WHERE);
    }
    return blackList;
  }

  async deleteBlockFriend(payload: RmqRequestBlockFriend) {
    if (this.isSameId(payload.blocker, payload.blocked)) {
      throw new RmqError(409, 'same id', WHERE);
    }
    await this.userService.readUserById({ id: payload.blocked });

    let findBlackList;
    try {
      findBlackList = await this.blackListRepository.findOne({
        where: { blocker: payload.blocker, blocked: payload.blocked },
      });
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }

    if (!findBlackList) {
      throw new RmqError(409, 'not found request', WHERE);
    }

    try {
      await this.blackListRepository.remove(findBlackList);
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
  }

  async createFriend(payload: RmqRequestFriend) {
    let findFriendRequest;
    try {
      findFriendRequest = await this.friendRequestRepository.findOne({
        where: { requester: payload.requester, receiver: payload.receiver },
      });
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
    if (!findFriendRequest) {
      throw new RmqError(409, 'Not found request', WHERE);
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
      throw new RmqError(409, 'Conflict', WHERE);
    } finally {
      await queryRunner.release();
    }

    return friend;
  }

  async readFriend(payload: RmqRequestFriendId) {
    let friendList;
    try {
      friendList = await this.friendRepository.find({
        where: [{ requester: payload.userId }, { receiver: payload.userId }],
      });
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
    if (friendList.length === 0) {
      throw new RmqError(404, 'Not found list', WHERE);
    }
    return friendList;
  }

  async deleteFriend(payload: RmqRequestFriend) {
    if (this.isSameId(payload.requester, payload.receiver)) {
      throw new RmqError(409, 'same id', WHERE);
    }

    await this.userService.readUserById({ id: payload.receiver });

    let findFriend;
    try {
      findFriend = await this.friendRepository.findOne({
        where: [
          { requester: payload.requester, receiver: payload.receiver },
          { requester: payload.receiver, receiver: payload.requester },
        ],
      });
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }

    if (!findFriend) {
      throw new RmqError(409, 'not found friend', WHERE);
    }

    try {
      await this.friendRepository.remove(findFriend);
    } catch (e) {
      throw new RmqError(500, `DB Error : ${e}`, WHERE);
    }
  }
}
