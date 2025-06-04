import { Category } from 'src/categories/categories.entity';
import { Channel } from 'src/channels/channels.entity';
import { Customer } from 'src/customers/customers.entity';
import { Item } from 'src/items/items.entity';
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

  @Column({
    type: 'varchar',
    name: 'token_key',
    length: 255,
    unique: true,
    nullable: true,
  })
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

  @OneToMany(() => Customer, (customer) => customer.shop)
  customers: Customer[];

  @OneToMany(() => Channel, (channel) => channel.shop)
  channels: Channel[];
}
