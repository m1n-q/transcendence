import { User } from './User';
import {
  Entity,
  CreateDateColumn,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
} from 'typeorm';

@Entity('friend')
export class Friend {
  @PrimaryColumn()
  requesterId: string;

  @PrimaryColumn()
  receiverId: string;

  @CreateDateColumn()
  createdDate: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;
}
