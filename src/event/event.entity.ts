import { EventAttachment } from 'src/attachment/attachment.entity';
import { Division } from 'src/division/division.entity';
import { EventCategory, EventStatus } from 'src/common/enums';
import { Interview } from 'src/interview/interview.entity';
import { Link } from 'src/link/link.entity';
import { User } from 'src/user/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { Faq } from 'src/faq/faq.entity';
import { Application } from 'src/application/application.entity';
import { EventSocialAccount } from 'src/social_account/social_account.entity';

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: EventCategory,
  })
  category: EventCategory;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  status: EventStatus;

  @Column({ type: 'timestamptz' })
  datetime_start: Date;

  @Column({ type: 'timestamptz' })
  datetime_end: Date;

  @Column()
  max_selected_division: number;

  @Column({ nullable: true })
  web_url: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  banner: string;

  @CreateDateColumn({ type: 'timestamptz' })
  @Exclude()
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @Expose({ groups: ['event'] })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  @Exclude()
  deleted_at: Date;

  @Index()
  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  @Expose({ groups: ['event'] })
  author: User;

  @OneToOne(() => Interview, (interview) => interview.event, {
    eager: true,
    cascade: ['soft-remove'],
  })
  @Expose({ groups: ['event'] })
  interview: Interview;

  @OneToMany(
    () => EventSocialAccount,
    (eventSocialAccount) => eventSocialAccount.event,
    {
      eager: true,
      cascade: ['soft-remove'],
    },
  )
  @Expose({ groups: ['event'] })
  social_accounts: EventSocialAccount[];

  // call Divisions endpoint
  @OneToMany(() => Division, (division) => division.event, {
    cascade: ['soft-remove'],
  })
  @Exclude()
  divisions: Division[];

  // call Applications endpoint
  @OneToMany(() => Application, (application) => application.event, {
    cascade: ['soft-remove'],
  })
  @Exclude()
  applications: Application[];

  // call Links endpoint
  @OneToMany(() => Link, (link) => link.event, {
    cascade: ['soft-remove'],
  })
  @Exclude()
  links: Link[];

  // call Faqs endpoint
  @OneToMany(() => Faq, (faq) => faq.event, {
    cascade: ['soft-remove'],
  })
  @Exclude()
  faqs: Faq[];

  // call Attachments endpoint
  @OneToMany(
    () => EventAttachment,
    (eventAttachment) => eventAttachment.event,
    {
      cascade: ['soft-remove'],
    },
  )
  @Exclude()
  attachments: EventAttachment[];
}
