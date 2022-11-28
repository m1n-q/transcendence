import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DM } from '../../common/entities/dm.entity';
import { toRmqError } from '../../common/rmq/errors/to-rmq-error';
import { toUserProfile } from '../../common/utils/utils';
import { DmGetMessagesDto } from '../dto/dm-get-messages.dto';
import { DmDto } from '../dto/dm.dto';

@Injectable()
export class DmService {
  constructor(
    @InjectRepository(DM)
    private readonly dmRepository: Repository<DM>,
  ) {}

  async storeMessage(dmDto: DmDto) {
    const dm = this.dmRepository.create({
      senderId: dmDto.sender_id,
      receiverId: dmDto.receiver_id,
      payload: dmDto.payload,
    });
    const saved = await this.dmRepository.save(dm).catch((e) => {
      throw toRmqError(e);
    });
    return saved.dmId;
  }

  async getAllMessages(data: DmGetMessagesDto) {
    const messages = await this.dmRepository
      .find({
        where: [
          { receiverId: data.receiver_id, senderId: data.sender_id },
          { senderId: data.receiver_id, receiverId: data.sender_id },
        ],

        order: { created: 'ASC' },
        relations: ['sender', 'receiver'],
      })
      .catch((e) => {
        throw toRmqError(e);
      });
    return {
      messages: messages.map((dm) => {
        return {
          sender: toUserProfile(dm.sender),
          receiver: toUserProfile(dm.receiver),
          payload: dm.payload,
          created: dm.created,
        };
      }),
    };
  }
}
