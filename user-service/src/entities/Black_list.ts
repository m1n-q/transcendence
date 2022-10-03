import { User } from './User';
import {
  Entity,
  CreateDateColumn,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
} from 'typeorm';

@Entity('blackList')
export class BlackList {
  @PrimaryColumn()
  blockerId: string;

  @PrimaryColumn()
  blockedId: string;

  @CreateDateColumn()
  createdDate: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'blocker_id' })
  requester: User;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'blocked_id' })
  receiver: User;
}
