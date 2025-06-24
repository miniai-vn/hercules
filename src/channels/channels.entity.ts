import { Conversation } from 'src/conversations/conversations.entity';
import { Customer } from 'src/customers/customers.entity';
import { Department } from 'src/departments/departments.entity';
import { Shop } from 'src/shops/shops.entity';
import { User } from 'src/users/entities/users.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  DeleteDateColumn,
} from 'typeorm';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'varchar', length: 255, name: 'name' })
  name: string;

  @Column({ type: 'varchar', length: 50, name: 'type' })
  type: string;

  @Column({ type: 'varchar', length: 50, default: 'inactive', name: 'status' })
  status: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'app_id' })
  appId?: string;

  @Column({ type: 'text', nullable: true, name: 'avatar' })
  avatar?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'app_secret' })
  appSecret?: string;

  @Column({ type: 'text', nullable: true, name: 'access_token' })
  accessToken?: string;

  @Column({ type: 'text', nullable: true, name: 'refresh_token' })
  refreshToken?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'expire_token_time' })
  expireTokenTime?: Date;

  @Column({ type: 'json', nullable: true, name: 'extra_data' })
  extraData?: Record<string, any>;

  @Column({
    type: 'boolean',
    nullable: true,
    name: 'is_use_product_from_miniapp',
  })
  isUseProductFromMiniapp?: boolean;

  @Column({
    type: 'boolean',
    nullable: true,
    name: 'enable_auto_reply',
  })
  enableAutoReply?: boolean;

  @ManyToMany(() => User, (user) => user.channels, {
    cascade: true,
  })
  @JoinTable({
    name: 'user_channels',
    joinColumn: { name: 'channel_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  users: User[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Department, (department) => department.channels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @OneToMany(() => Customer, (customer) => customer.channel, {
    onDelete: 'SET NULL',
    cascade: true,
  })
  customers: Customer[];

  @OneToMany(() => Conversation, (conversation) => conversation.channel, {
    onDelete: 'SET NULL',
  })
  conversations: Conversation[];

  @ManyToOne(() => Shop, (shop) => shop.channels, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;
}
