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
  blocker: string;

  @PrimaryColumn()
  blocked: string;

  @CreateDateColumn()
  createdDate: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'blocker_id' })
  requester: User;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'blocked_id' })
  receiver: User;
}
