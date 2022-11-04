import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

@Injectable()
export class FriendService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async getFriends(id) {
    let response;
    try {
      response = await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.read.friend.rk',
        payload: {
          userId: id,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-service failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return response;
  }

  async makeRequest(id, receiver) {
    let response;
    try {
      response = await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.create.friend.request.rk',
        payload: {
          requester: id,
          receiver: receiver,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-service failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return response;
  }

  async deleteFriendRequest(id, friendId) {
    let response;
    try {
      response = await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.delete.friend.request.rk',
        payload: {
          requester: id,
          receiver: friendId,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-service failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
  }

  async getRequestsReceived(id: string) {
    let response;
    try {
      response = await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.read.friend.request.rk',
        payload: {
          userId: id,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-service failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return response;
  }

  async createFriend(id, friendId) {
    let response;
    try {
      response = await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.create.friend.rk',
        payload: {
          requester: friendId,
          receiver: id,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-service failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return response;
  }

  async deleteFriend(id, friendId) {
    let response;
    try {
      response = await this.amqpConnection.request({
        exchange: 'user.d.x',
        routingKey: 'user.delete.friend.rk',
        payload: {
          requester: id,
          receiver: friendId,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException('request to user-service failed');
    }
    if (!response.success)
      throw new HttpException(response.error.message, response.error.code);
    return response;
  }
}
