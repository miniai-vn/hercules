import { Users } from 'src/auth/entity/users.entity';
import { Chunks } from 'src/chunks/entity/chunks';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('file_materials')
export class FileMaterialItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'text',
    nullable: true,
    name: 'name',
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'path',
  })
  path: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'size',
  })
  size: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'status',
  })
  status: string;

  @Column({
    type: 'text',
    nullable: true,
    name: 'type',
  })
  type: string;

  @OneToMany(() => Chunks, (chunks) => chunks.file)
  chunks: Chunks[];

  @ManyToOne(() => Users, (user) => user.fileMaterialItems)
  user: Users;
  @Column({
    type: 'date',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  createdAt: Date;

  @Column({
    type: 'date',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'updated_at',
  })
  updatedAt: Date;
}
