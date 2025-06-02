import { Shop } from 'src/shops/entities/shop';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';
import { Item } from './item';

@Entity()
export class Skus {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column('simple-array', { default: [] })
  images: string[];

  @Column()
  price: number;

  @Column({ name: 'origin_price', nullable: true })
  originPrice: number;

  @Column({ name: 'is_active' })
  isActive: boolean;

  @ManyToOne(() => Shop, (shop) => shop.items)
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @Column({ nullable: true })
  status?: string;

  // many to one relationship with Item
  @ManyToOne(() => Item, (item) => item.skus, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
