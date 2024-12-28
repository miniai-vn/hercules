// defind meterials entity with one to many relation with meterial items entity

import { Materials } from 'src/materials/entity/materials.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class MaterialItems {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'text',
    nullable: true,
    name: 'text',
  })
  text: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'material_file',
  })
  file: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'material_url',
  })
  url: string;

  @Column({
    type: 'text',
    nullable: false,
    name: 'status',
  })
  status: string;

  @Column({
    type: 'text',
    nullable: false,
    name: 'is_sync',
  })
  isSync: boolean;

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

  @Column({
    type: 'int',
    nullable: false,
    name: 'material_id',
  })
  materialId: number;

  @ManyToOne(() => Materials, (matarial) => matarial.materialItems)
  @JoinColumn({ name: 'material_id' })
  material: Materials;
}
