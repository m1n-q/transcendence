import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DM } from '../../common/entities/dm.entity';
import { toRmqError } from '../../common/rmq/errors/to-rmq-error';
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

  async getAllMessages(data: { receiverId: string; senderId: string }) {
    const messages = await this.dmRepository
      .find({
        where: data,
        order: { created: 'DESC' },
      })
      .catch((e) => {
        throw toRmqError(e);
      });

    return messages;
  }
}
