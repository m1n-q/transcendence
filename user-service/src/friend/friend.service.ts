import { RmqError } from '../user/dto/rmq.user.response.dto';
import { Friend } from './../entities/Friend';
import { UserService } from './../user/user.service';
import { FriendRequest } from './../entities/Friend_request';
import { User } from './/../entities/User';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RmqFriendRequest, RmqFriendRequestId } from './dto/rmq.friend.request';
import { Repository } from 'typeorm';

const WHERE = 'user_service';

@Injectable()
export class FriendService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(FriendRequest)
    private friendRequestRepository: Repository<FriendRequest>,
    @InjectRepository(Friend)
    private friendRepository: Repository<Friend>,
    private readonly userService: UserService,
  ) {}

  async createFriendRequest(payload: RmqFriendRequest) {
    await this.userService.readUserById({ id: payload.receiver });

    const findFriend = await this.friendRepository.findOne({
      where: { requester: payload.requester, receiver: payload.receiver },
    });
    if (findFriend) {
      throw new RmqError(409, 'already friend', WHERE);
    }

    const findFriendRequest = await this.friendRequestRepository.findOne({
      where: { requester: payload.requester, receiver: payload.receiver },
    });
    if (findFriendRequest) {
      throw new RmqError(409, 'already request', WHERE);
    }

    const friendRequest = await this.friendRequestRepository.create(payload);

    try {
      await this.friendRequestRepository.save(friendRequest);
    } catch (error) {
      throw new RmqError(409, 'Conflict', WHERE);
    }
    return friendRequest;
  }

  async readFriendRequest(payload: RmqFriendRequestId) {
    const friendList = await this.friendRequestRepository.find({
      where: { requester: payload.userId },
    });
    if (friendList.length === 0) {
      throw new RmqError(404, 'Not found list', WHERE);
    }
    return friendList;
  }

  async deleteFriendRequest(payload: RmqFriendRequest) {
    await this.userService.readUserById({ id: payload.receiver });

    const findFriendRequest = await this.friendRequestRepository.findOne({
      where: { requester: payload.requester, receiver: payload.receiver },
    });

    if (!findFriendRequest) {
      throw new RmqError(409, 'not found request', WHERE);
    }

    try {
      await this.friendRequestRepository.remove(findFriendRequest);
    } catch (error) {
      throw new RmqError(409, 'Conflict', WHERE);
    }
  }
}
