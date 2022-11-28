import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class DM {
  @PrimaryGeneratedColumn('uuid')
  dmId: string;

  @Column('text')
  senderId: string;

  @Column('text')
  receiverId: string;

  @Column('text')
  payload: string;

  @CreateDateColumn()
  created: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;
}
