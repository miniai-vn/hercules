import { Item } from 'src/items/entities/item';
import { Shop } from 'src/shops/entities/shop';
import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  Unique,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  sId: string;

  @Column()
  type: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column('simple-array', { default: [] })
  images: string[];

  @Column({ nullable: true, unique: true })
  sCategoryId?: string;

  @Column({ nullable: true })
  storeId?: string;

  @ManyToOne(() => Shop, (shop) => shop.categories)
  shop: Shop;

  @OneToMany(() => Item, (item) => item.category)
  items: Item[];

  @Column({ nullable: true })
  platform?: string;

  @Column({ nullable: true })
  status?: string;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
