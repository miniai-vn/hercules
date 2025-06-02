import { Category } from 'src/categories/categories.entity';
import { Shop } from 'src/shops/shops.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Skus } from './sku.entity';

@Entity()
export class Item {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column()
  type: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column('simple-array', { default: [] })
  images: string[];

  @Column()
  price: number;

  @ManyToOne(() => Shop, (shop) => shop.items)
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @ManyToOne(() => Category, (category) => category.items, {
    nullable: true,
    cascade: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ nullable: true })
  status: string;

  // one to many relationship with SKU
  @OneToMany(() => Skus, (sku) => sku.item, { cascade: true })
  skus: Skus[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
