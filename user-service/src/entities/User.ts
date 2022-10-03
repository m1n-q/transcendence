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

  @Column()
  nickname: string;

  @Column()
  thirdPartyId: string;

  @Column({ nullable: true })
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
