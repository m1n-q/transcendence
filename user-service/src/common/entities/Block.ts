import { User } from './User';
import {
  Entity,
  CreateDateColumn,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('block')
export class BlackList {
  @PrimaryGeneratedColumn('uuid')
  block_id: string;

  @PrimaryColumn()
  blocker: string;

  @PrimaryColumn()
  blocked: string;

  @CreateDateColumn()
  createdDate: Date;

  @ManyToOne(() => User, (user) => user.user_id)
  @JoinColumn({ name: 'blocker' })
  requester: User;

  @ManyToOne(() => User, (user) => user.user_id)
  @JoinColumn({ name: 'blocked' })
  receiver: User;
}
