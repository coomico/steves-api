import { Exclude, Expose } from 'class-transformer';
import { Application } from 'src/application/application.entity';
import { Division } from 'src/division/division.entity';
import { Event } from 'src/event/event.entity';
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
export class Interview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamptz' })
  available_start: Date;

  @Column({ type: 'timestamptz' })
  available_end: Date;

  @Column()
  duration_minutes: number;

  @CreateDateColumn({ type: 'timestamptz' })
  @Exclude()
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  @Exclude()
  deleted_at: Date;

  // call Event endpoint
  @OneToOne(() => Event, (event) => event.interview)
  @JoinColumn({ name: 'event_id' })
  @Exclude()
  event: Event;

  @OneToMany(
    () => InterviewBlocking,
    (interviewBlocking) => interviewBlocking.interview,
    {
      cascade: ['soft-remove'],
    },
  )
  @Expose({ groups: ['interview'] })
  interview_blockings: InterviewBlocking[];

  @OneToMany(
    () => InterviewSchedule,
    (interviewSchedule) => interviewSchedule.interview,
    {
      cascade: ['soft-remove'],
    },
  )
  @Exclude()
  interview_schedules: InterviewSchedule[];

  @Expose({ groups: ['interview'] })
  get total_schedules() {
    return this.interview_schedules ? this.interview_schedules.length : 0;
  }
}

@Entity()
export class InterviewBlocking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamptz' })
  range_start: Date;

  @Column({ type: 'timestamptz' })
  range_end: Date;

  @Column({ nullable: true })
  reason: string;

  @DeleteDateColumn({ type: 'timestamptz' })
  @Exclude()
  deleted_at: Date;

  // call Interview endpoint
  @ManyToOne(() => Interview)
  @JoinColumn({ name: 'interview_id' })
  @Exclude()
  interview: Interview;
}

@Entity()
@Index(['interview', 'primary_division', 'selected_time'], { unique: true })
export class InterviewSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamptz' })
  selected_time: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  @Exclude()
  deleted_at: Date;

  @OneToOne(() => Application, (application) => application.interview_schedule)
  @JoinColumn({ name: 'application_id' })
  @Expose({ groups: ['schedule'] })
  application: Application;

  // call Interview endpoint
  @ManyToOne(() => Interview, (interview) => interview.interview_schedules)
  @JoinColumn({ name: 'interview_id' })
  @Exclude()
  interview: Interview;

  @ManyToOne(() => Division, (division) => division.interview_schedules)
  @JoinColumn({ name: 'primary_division_id' })
  @Expose({ groups: ['schedule'] })
  primary_division: Division;
}
