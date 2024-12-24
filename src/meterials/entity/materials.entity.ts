// defind meterials entity

import { Users } from 'src/auth/entity/users.entity';
import { MeterialItems } from 'src/meterial-items/entity/meterial-item.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Materials {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: false })
  name: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  description: string;

  @Column({
    type: 'text',
    nullable: false,
  })
  status: string;

  @Column({
    type: 'date',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'create_at',
  })
  createAt: Date;

  @Column({
    type: 'date',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'update_at',
  })
  updateAt: Date;

  @OneToMany(() => MeterialItems, (meterialItems) => meterialItems.meterial)
  meterialItems: MeterialItems[];

  // many to one user
  @ManyToOne(() => Users, (user) => user.meterials)
  @JoinColumn({ name: 'user_id' })
  user: Users;
}
