import { Exclude } from 'class-transformer';
import { LinkStatus } from 'src/common/enums';
import { Event } from 'src/event/event.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
@Index(['event', 'position'], { unique: true })
export class Link {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  @Exclude()
  url: string;

  @Column({
    type: 'enum',
    enum: LinkStatus,
    default: LinkStatus.PUBLIC,
  })
  status: LinkStatus;

  @Column()
  position: number;

  @CreateDateColumn({ type: 'timestamptz' })
  @Exclude()
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @Exclude()
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  @Exclude()
  deleted_at: Date;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  @Exclude() // call Event endpoint
  event: Event;
}
