// defind meterials entity with one to many relation with meterial items entity

import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class MeterialItems {
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
  @ManyToOne(() => MeterialItems, (user) => user.meterial)
  meterial: MeterialItems;
  // one to many relation with meterial
}
