import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nickname: string;

  @Column()
  provider: string;

  @Column({ unique: true })
  thirdPartyId: string;

  @Column({ unique: true, nullable: true })
  twoFactorAuthenticationKey: string;

  @Column({ nullable: true })
  twoFactorAuthenticationInfo: string;

  @Column()
  profileImage: string;

  @Column()
  rankScore: number;

  @CreateDateColumn()
  createdDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;
}
