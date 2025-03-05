import { Category } from 'src/categories/entities/category';
import { Shops } from 'src/shops/entities/shop';
import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Unique,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Item {
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

  @Column()
  price: number;

  @Column()
  originPrice: number;

  @ManyToOne(() => Shops, (shop) => shop.items)
  shop: Shops;

  @ManyToOne(() => Category, (category) => category.items, { nullable: true })
  category?: Category;

  @Column({ nullable: true })
  status?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
