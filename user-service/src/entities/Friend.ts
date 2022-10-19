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
  requester: string;

  @PrimaryColumn()
  receiver: string;

  @CreateDateColumn()
  createdDate: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'requester' })
  requesters: User;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'receiver' })
  receivers: User;
}
