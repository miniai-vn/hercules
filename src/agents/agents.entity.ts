import { Channel } from 'src/channels/channels.entity';
import { Department } from 'src/departments/departments.entity';
import { Shop } from 'src/shops/shops.entity';
import { User } from 'src/users/entities/users.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRAINING = 'training',
  MAINTENANCE = 'maintenance',
}

export enum ModelProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  DEEPSEEK = 'deepseek',
  GOOGLE = 'google',
  LOCAL = 'local',
  DEEPSEEK_V3 = 'deepseek-v3',
}

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'varchar', length: 255, name: 'name' })
  name: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'model_provider',
    default: ModelProvider.OPENAI,
  })
  modelProvider: ModelProvider;

  @Column({ type: 'varchar', length: 255, name: 'model_name' })
  modelName: string;

  @Column({ type: 'text', name: 'prompt' })
  prompt: string;

  @Column({
    type: 'varchar',
    length: 50,
    name: 'status',
    default: AgentStatus.INACTIVE,
  })
  status: AgentStatus;

  @Column({ type: 'json', name: 'model_config', nullable: true })
  modelConfig?: Record<string, any>;

  @Column({ type: 'text', name: 'description', nullable: true })
  description?: string;

  @ManyToMany(() => User, (user) => user.agents, {
    cascade: true,
  })
  @JoinTable({
    name: 'user_agents',
    joinColumn: { name: 'agent_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  users: User[];

  @ManyToOne(() => Shop, (shop) => shop.agents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @ManyToMany(() => Department, (department) => department.agents, {
    cascade: true,
  })
  @JoinTable({
    name: 'department_agents',
    joinColumn: { name: 'agent_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'department_id', referencedColumnName: 'id' },
  })
  departments: Department[];

  @ManyToMany(() => Channel, (channel) => channel.agents, {
    cascade: true,
  })
  @JoinTable({
    name: 'agent_channels',
    joinColumn: { name: 'agent_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'channel_id', referencedColumnName: 'id' },
  })
  channels: Channel[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
