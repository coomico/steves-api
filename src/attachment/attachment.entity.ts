import { Exclude } from 'class-transformer';
import { Application } from 'src/application/application.entity';
import { AttachmentStatus, EventAttachmentType } from 'src/common/enums';
import { Event } from 'src/event/event.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Exclude()
  filename: string;

  @Column()
  original_filename: string;

  @Column({
    type: 'enum',
    enum: AttachmentStatus,
    default: AttachmentStatus.PRIVATE,
  })
  status: AttachmentStatus;

  @Column()
  content_type: string;

  @Column()
  size: number;

  @Column({ unique: true })
  @Exclude()
  storage_key: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @Exclude()
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  @Exclude()
  deleted_at: Date;
}

@Entity()
export class EventAttachment extends Attachment {
  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  @Exclude() // call Event endpoint
  event: Event;

  @Column({
    type: 'enum',
    enum: EventAttachmentType,
    default: EventAttachmentType.OTHER,
  })
  type: EventAttachmentType;
}

@Entity()
export class ApplicationAttachment extends Attachment {
  @ManyToOne(() => Application)
  @JoinColumn({ name: 'application_id' })
  @Exclude() // call Application endpoint
  application: Application;
}
