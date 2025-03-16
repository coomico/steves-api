import { Division } from 'src/division/division.entity';
import { Registrant } from 'src/registrant/registrant.entity';
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
    id: 'ASC',
    priority: 'ASC',
  },
})
export class SelectedDivision {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public priority: number;

  @DeleteDateColumn({ type: 'timestamptz' })
  public deleted_at: Date;

  @ManyToOne(() => Registrant)
  @JoinColumn({ name: 'registrant_id' })
  public registrant: Registrant;

  @ManyToOne(() => Division)
  @JoinColumn({ name: 'division_id' })
  public division: Division;
}
