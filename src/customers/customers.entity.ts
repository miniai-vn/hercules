import { Channel } from 'src/channels/channels.entity';
import { Shop } from 'src/shops/shops.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'platform' })
  platform: string;

  @Column({ type: 'varchar', length: 255, name: 'external_id' })
  externalId: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'avatar' })
  avatar?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'name' })
  name?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'phone' })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'email' })
  email?: string;

  @Column({ type: 'text', nullable: true, name: 'address' })
  address?: string;

  @Column({ type: 'text', nullable: true, name: 'note' })
  note?: string;

  @ManyToOne(() => Shop, (shop) => shop.customers, {
    nullable: true,
  })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @ManyToOne(() => Channel, (channel) => channel.customers, {
    nullable: true,
  })
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
