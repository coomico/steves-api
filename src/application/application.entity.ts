import { Exclude } from 'class-transformer';
import { ApplicationAttachment } from 'src/attachment/attachment.entity';
import { ApplicationStatus } from 'src/common/enums/application-status.enum';
import { Event } from 'src/event/event.entity';
import { InterviewSchedule } from 'src/interview/interview.entity';
import { SelectedDivision } from 'src/selected_division/selected_division.entity';
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

@Entity()
@Index(['user', 'event'], { unique: true })
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.WAITING,
  })
  status: ApplicationStatus;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @Exclude()
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  @Exclude()
  deleted_at: Date;

  @Index()
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  @Exclude() // call User endpoint
  user: User;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  @Exclude() // call Event endpoint
  event: Event;

  @OneToOne(
    () => InterviewSchedule,
    (interviewSchedule) => interviewSchedule.application,
    {
      eager: true,
      cascade: ['soft-remove', 'remove'],
    },
  )
  interview_schedule: InterviewSchedule;

  @OneToMany(
    () => ApplicationAttachment,
    (applicationAttachment) => applicationAttachment.application,
    {
      cascade: ['insert', 'soft-remove', 'remove'],
    },
  )
  @Exclude() // call Application Attachments endpoint
  attachments: ApplicationAttachment[];

  @OneToMany(
    () => SelectedDivision,
    (selectedDivision) => selectedDivision.application,
    {
      cascade: ['insert', 'soft-remove', 'remove'],
    },
  )
  public selected_divisions: SelectedDivision[];
}
