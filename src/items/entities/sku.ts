import { Shops } from 'src/shops/entities/shop';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Item } from './item';

@Entity()
export class Skus {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  sId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column('simple-array', { default: [] })
  images: string[];

  @Column()
  price: number;

  @Column()
  originPrice: number;

  @Column()
  isActive: boolean;

  @ManyToOne(() => Shops, (shop) => shop.items)
  shop: Shops;

  @Column({ nullable: true })
  status?: string;

  // many to one relationship with Item
  @ManyToOne(() => Item, (item) => item.skus)
  item: Item;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
