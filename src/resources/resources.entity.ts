import { Department } from 'src/departments/departments.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  path: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'json', nullable: true })
  extra?: Record<string, any>;

  @Column({ type: 'text', name: 's3_key', nullable: true })
  s3Key?: string;

  @Column({ type: 'varchar', name: 's3_key_json', length: 255, nullable: true })
  s3KeyJson?: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  type: string;

  @Column({
    type: 'boolean',
    default: true,
    nullable: false,
    name: 'is_active',
  })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, default: 'new' })
  status?: string;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    name: 'updated_at',
  })
  updatedAt: Date;

  @ManyToOne(() => Department, (department) => department.resources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'department_id',
  })
  department: Department;

  // Self-referencing relationship - Parent resource
  @ManyToOne(() => Resource, (resource) => resource.resources, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'parent_id',
  })
  parent?: Resource;

  // Self-referencing relationship - Child resources
  @OneToMany(() => Resource, (resource) => resource.parent)
  resources: Resource[];

  @Column({ type: 'varchar', nullable: true, unique: true })
  code?: string;
}
