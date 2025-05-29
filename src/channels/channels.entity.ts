import { Department } from 'src/departments/departments.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // e.g., Zalo, Facebook, TikTok

  @Column({ type: 'varchar', length: 50, default: 'inactive' })
  status: string; // e.g., active, inactive

  @Column({ type: 'text', nullable: true })
  url?: string;

  @Column({ type: 'int', nullable: true })
  audienceSize?: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  apiKey?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  apiSecret?: string;

  @Column({ type: 'text', nullable: true })
  accessToken?: string;

  @Column({ type: 'text', nullable: true })
  refreshToken?: string;

  @Column({ type: 'json', nullable: true })
  authCredentials?: Record<string, any>;

  @Column({ type: 'json', nullable: true, name: 'extra_data' })
  extraData?: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  apiStatus?: string;

  @Column({ type: 'int', nullable: true })
  departmentId?: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Department, (department) => department.channels, {
    onDelete: 'CASCADE',
  })
  department?: Department;
}
