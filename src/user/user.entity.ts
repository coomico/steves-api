import { Exclude, Expose } from 'class-transformer';
import { RefreshToken } from 'src/auth/auth.entity';
import { Event } from 'src/event/event.entity';
import { Registrant } from 'src/registrant/registrant.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'bigint',
    unique: true,
  })
  nim: string;

  @Column()
  name: string;

  @Column({ unique: true })
  @Expose({ groups: ['user'] })
  email: string;

  @Column()
  picture_path: string;

  @CreateDateColumn({ type: 'timestamptz' })
  @Expose({ groups: ['user'] })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  @Expose({ groups: ['user'] })
  updated_at: Date;

  @OneToMany(() => Event, (event) => event.author)
  @Expose({ groups: ['user'] })
  events: Event[];

  @OneToMany(() => Registrant, (registrant) => registrant.user)
  @Expose({ groups: ['user'] })
  registrants: Registrant[];

  @OneToMany(() => RefreshToken, (refresh_token) => refresh_token.user)
  @Exclude()
  refresh_tokens: RefreshToken[];
}
