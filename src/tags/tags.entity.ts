import { Conversation } from 'src/conversations/conversations.entity';
import { Customer } from 'src/customers/customers.entity';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Shop } from '../shops/shops.entity';

@Entity('tags')
@Check('valid_color_format', "color ~ '^#[0-9A-Fa-f]{6}$'")
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Shop, (shop) => shop.tags, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 7, default: '#6B7280' })
  color: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  type: string;

  @ManyToMany(() => Customer, (customer) => customer.tags)
  @JoinTable({
    name: 'tag_customers',
    joinColumn: { name: 'tag_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'customer_id', referencedColumnName: 'id' },
  })
  customers: Customer[];

  @ManyToMany(() => Conversation, (conversation) => conversation.tags, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'tag_conversations',
    joinColumn: { name: 'tag_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'conversation_id', referencedColumnName: 'id' },
  })
  conversations: Conversation[];

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
