import { Department } from 'src/departments/departments.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'varchar', length: 255, name: 'name' })
  name: string;

  @Column({ type: 'varchar', length: 50, name: 'type' })
  type: string; // e.g., Zalo, Facebook, TikTok

  @Column({ type: 'varchar', length: 50, default: 'inactive', name: 'status' })
  status: string; // e.g., active, inactive

  @Column({ type: 'text', nullable: true, name: 'url' })
  url?: string;

  @Column({ type: 'int', nullable: true, name: 'audience_size' })
  audienceSize?: number;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'api_key' })
  apiKey?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'api_secret' })
  apiSecret?: string;

  @Column({ type: 'text', nullable: true, name: 'access_token' })
  accessToken?: string;

  @Column({ type: 'text', nullable: true, name: 'refresh_token' })
  refreshToken?: string;

  @Column({ type: 'json', nullable: true, name: 'auth_credentials' })
  authCredentials?: Record<string, any>;

  @Column({ type: 'json', nullable: true, name: 'extra_data' })
  extraData?: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'api_status' })
  apiStatus?: string;

  @Column({
    type: 'boolean',
    nullable: true,
    name: 'is_use_product_from_miniapp',
  })
  isUseProductFromMiniapp?: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Department, (department) => department.channels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'department_id' })
  department?: Department;
}
