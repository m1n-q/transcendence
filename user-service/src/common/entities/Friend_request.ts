import { User } from './User';
import {
  Entity,
  CreateDateColumn,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('friend_request')
export class FriendRequest {
  @PrimaryGeneratedColumn('uuid')
  request_id: string;

  @PrimaryColumn()
  requester: string;

  @PrimaryColumn()
  receiver: string;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created: Date;

  @ManyToOne(() => User, (user) => user.user_id)
  @JoinColumn({ name: 'requester' })
  requesters: User;

  @ManyToOne(() => User, (user) => user.user_id)
  @JoinColumn({ name: 'receiver' })
  receivers: User;
}
