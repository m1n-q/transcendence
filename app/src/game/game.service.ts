import { UserProfile } from './../user/user-info';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { RmqEvent } from 'src/common/rmq/types/rmq-event';

@Injectable()
export class GameService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  async inviteById(recvUser: string, senderProfile: UserProfile) {
    const event: RmqEvent = {
      recvUsers: [recvUser],
      data: { sender: senderProfile },
      created: new Date(),
    };
    this.amqpConnection.publish(
      'game.t.x',
      'event.on.game.invitation.rk',
      event,
    );
    return;
  }
}
