import { Exclude, Expose } from 'class-transformer';
import { Event } from 'src/event/event.entity';
import { InterviewSchedule } from 'src/interview/interview.entity';
import { SelectedDivision } from 'src/selected_division/selected_division.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Division {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 1 })
  capacity: number;

  @DeleteDateColumn({ type: 'timestamptz' })
  @Exclude()
  deleted_at: Date;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  @Exclude() // call Event endpoint
  event: Event;

  @OneToMany(
    () => SelectedDivision,
    (selectedDivision) => selectedDivision.division,
    {
      onDelete: 'CASCADE',
    },
  )
  @Exclude() // call Selected Divisions endpoint
  public selected_divisions: SelectedDivision[];

  @OneToMany(
    () => InterviewSchedule,
    (interviewSchedule) => interviewSchedule.primary_division,
    {
      onDelete: 'CASCADE',
    },
  )
  @Exclude() // call Interview Schedules endpoint
  interview_schedules: InterviewSchedule[];

  @Expose({ groups: ['division'] })
  get total_registrants() {
    return this.selected_divisions ? this.selected_divisions.length : 0;
  }
}
