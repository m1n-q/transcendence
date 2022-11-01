import { Expose } from 'class-transformer';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('user')
export class User {
  @Expose()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Expose()
  @Column({ unique: true })
  nickname: string;

  @Expose()
  @Column()
  provider: string;

  @Expose()
  @Column({ unique: true })
  thirdPartyId: string;

  @Column({ unique: true, nullable: true })
  twoFactorAuthenticationKey: string;

  @Column({ nullable: true })
  twoFactorAuthenticationInfo: string;

  @Expose()
  @Column()
  profImg: string;

  @Column()
  rankScore: number;

  @CreateDateColumn()
  createdDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;
}
