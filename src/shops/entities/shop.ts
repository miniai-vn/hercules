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
export class Shop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  sId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  isPublic?: boolean;

  @OneToMany(() => Category, (category) => category.shop)
  categories: Category[];

  @OneToMany(() => Item, (item) => item.shop)
  items: Item[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
