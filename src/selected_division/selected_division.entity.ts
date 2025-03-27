import { Division } from 'src/division/division.entity';
import { Registrant } from 'src/registrant/registrant.entity';
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
@Index(['registrant', 'priority'], { unique: true })
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

  @ManyToOne(() => Registrant)
  @JoinColumn({ name: 'registrant_id' })
  public registrant: Registrant;

  @ManyToOne(() => Division)
  @JoinColumn({ name: 'division_id' })
  public division: Division;
}
