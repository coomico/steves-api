import { Exclude, Expose } from 'class-transformer';
import { Application } from 'src/application/application.entity';
import { RefreshToken } from 'src/auth/auth.entity';
import { UserDegree, UserDepartment } from 'src/common/enums';
import { Event } from 'src/event/event.entity';
import { UserSocialAccount } from 'src/social_account/social_account.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'bigint',
    unique: true,
  })
  nim: string;

  @Column()
  name: string;

  @Column({ unique: true })
  @Expose({ groups: ['user'] })
  email: string;

  @Column()
  picture: string;

  @Column({
    type: 'enum',
    enum: UserDegree,
    nullable: true,
  })
  degree: UserDegree;

  @Column({
    type: 'enum',
    enum: UserDepartment,
    nullable: true,
  })
  department: UserDepartment;

  @Column({ nullable: true })
  entry_year: number;

  @Column({
    length: 300,
    nullable: true,
  })
  bio: string;

  @Column({ nullable: true })
  web_url: string;

  @CreateDateColumn({ type: 'timestamptz' })
  @Expose({ groups: ['user'] })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @Expose({ groups: ['user'] })
  updated_at: Date;

  @OneToMany(() => Event, (event) => event.author)
  @Expose({ groups: ['user'] })
  events: Event[];

  @OneToMany(() => Application, (application) => application.user)
  @Expose({ groups: ['user'] })
  applications: Application[];

  @OneToMany(
    () => UserSocialAccount,
    (userSocialAccount) => userSocialAccount.user,
    {
      eager: true,
    },
  )
  @Expose({ groups: ['user'] })
  social_accounts: UserSocialAccount[];

  @OneToMany(() => RefreshToken, (refresh_token) => refresh_token.user)
  @Exclude()
  refresh_tokens: RefreshToken[];
}
