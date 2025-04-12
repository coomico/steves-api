import { Exclude } from 'class-transformer';
import { SocialAccountType } from 'src/common/enums/social-account.enum';
import { Event } from 'src/event/event.entity';
import { User } from 'src/user/user.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export abstract class SocialAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: SocialAccountType,
  })
  type: SocialAccountType;

  @Column()
  url: string;
}

@Entity()
@Index(['user', 'type'], { unique: true })
export class UserSocialAccount extends SocialAccount {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  @Exclude() // call User endpoint
  user: User;
}

@Entity()
@Index(['event', 'type'], { unique: true })
export class EventSocialAccount extends SocialAccount {
  @DeleteDateColumn({ type: 'timestamptz' })
  @Exclude()
  deleted_at: Date;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  @Exclude() // call Event endpoint
  event: Event;
}
