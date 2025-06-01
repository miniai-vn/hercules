import { Category } from 'src/categories/categories.entity';
import { Item } from 'src/items/entities/item';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('shops')
export class Shop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', name: 'token_key', length: 255, unique: true })
  tokenKey: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', name: 'zalo_id', length: 255, nullable: true })
  zaloId?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date | null;

  @OneToMany(() => Category, (category) => category.shop)
  categories: Category[];

  @OneToMany(() => Item, (item) => item.shop)
  items: Item[];
}
