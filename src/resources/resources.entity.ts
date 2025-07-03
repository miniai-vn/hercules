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

  @Column({ type: 'varchar', length: 50, nullable: false })
  type: string;

  @Column({
    type: 'boolean',
    default: false,
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

  @OneToMany(() => Resource, (resource) => resource.resources)
  @JoinColumn({
    name: 'parent_id',
  })
  resources: Resource[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  code?: string;
}
