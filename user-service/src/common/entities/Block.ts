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

@Entity('block')
export class Block {
  @PrimaryGeneratedColumn('uuid')
  block_id: string;

  @PrimaryColumn()
  blocker: string;

  @PrimaryColumn()
  blocked: string;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created: Date;

  @ManyToOne(() => User, (user) => user.user_id)
  @JoinColumn({ name: 'blocker' })
  requester: User;

  @ManyToOne(() => User, (user) => user.user_id)
  @JoinColumn({ name: 'blocked' })
  receiver: User;
}
