import { Application } from 'src/application/application.entity';
import { Division } from 'src/division/division.entity';
import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
@Index(['application', 'priority'], { unique: true })
export class SelectedDivision {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public priority: number;

  @Column({
    length: 1800,
  })
  public motivation_letter: string;

  @DeleteDateColumn({ type: 'timestamptz' })
  public deleted_at: Date;

  @ManyToOne(() => Application)
  @JoinColumn({ name: 'application_id' })
  public application: Application;

  @ManyToOne(() => Division)
  @JoinColumn({ name: 'division_id' })
  public division: Division;
}
