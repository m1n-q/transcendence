import { Expose } from 'class-transformer';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('user')
@Index(['provider', 'thirdPartyId'], { unique: true })
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
  @Column()
  thirdPartyId: string;

  @Column({ unique: true, nullable: true })
  twoFactorAuthenticationKey: string;

  @Column({ nullable: true })
  twoFactorAuthenticationType: string;

  @Expose()
  @Column({ nullable: true })
  profImg: string;

  @Column()
  rankScore: number;

  @CreateDateColumn()
  createdDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;
}
