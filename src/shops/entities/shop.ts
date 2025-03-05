import { Category } from 'src/categories/entities/category';
import { Item } from 'src/items/entities/item';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Shops {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  sId: string;

  @Column()
  name: string;

  @OneToMany(() => Category, (category) => category.shop)
  categories: Category[];

  @OneToMany(() => Item, (item) => item.shop)
  items: Item[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
