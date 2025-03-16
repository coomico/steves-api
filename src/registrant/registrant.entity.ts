import { Exclude } from 'class-transformer';
import { RegistrantAttachment } from 'src/attachment/attachment.entity';
import { RegistrantStatus } from 'src/common/enums';
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
export class Registrant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: RegistrantStatus,
    default: RegistrantStatus.WAITING,
  })
  status: RegistrantStatus;

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
    (interviewSchedule) => interviewSchedule.registrant,
    {
      eager: true,
      cascade: ['soft-remove', 'remove'],
    },
  )
  interview_schedule: InterviewSchedule;

  @OneToMany(
    () => RegistrantAttachment,
    (registrantAttachment) => registrantAttachment.registrant,
    {
      cascade: ['insert', 'soft-remove', 'remove'],
    },
  )
  @Exclude() // call Registrant Attachments endpoint
  attachments: RegistrantAttachment[];

  @OneToMany(
    () => SelectedDivision,
    (selectedDivision) => selectedDivision.registrant,
    {
      cascade: ['insert', 'soft-remove', 'remove'],
    },
  )
  public selected_divisions: SelectedDivision[];
}
