import { on } from 'events';
import { Item } from 'src/items/items.entity';
import { Shop } from 'src/shops/shops.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column()
  type: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column('simple-array', { default: [] })
  images: string[];

  @ManyToOne(() => Shop, (shop) => shop.categories)
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  // @Column({ name: 'shop_id', nullable: true })
  // shopId: string;

  @OneToMany(() => Item, (item) => item.category)
  items: Item[];

  @Column({ nullable: true })
  status?: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
