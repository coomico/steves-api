import { Exclude } from 'class-transformer';
import { Event } from 'src/event/event.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({
  orderBy: {
    id: 'ASC'
  }
})
export class Faq {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  question: string;

  @Column()
  answer: string;

  @DeleteDateColumn({ type: 'timestamptz' })
  @Exclude()
  deleted_at: Date;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  @Exclude() // call Event endpoint
  event: Event;
}