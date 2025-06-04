import { Conversation } from 'src/conversations/conversations.entity';
import { Shop } from 'src/shops/shops.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true, name: 'platform' })
  platform: string; // e.g., Zalo, Facebook, TikTok

  @Column({ type: 'varchar', length: 255, name: 'external_id' })
  externalId: string; // ID of the customer on the specific channel

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'name' })
  name?: string;

  @ManyToMany(() => Conversation, (conversation) => conversation.customers)
  @JoinTable({
    name: 'conversation_customers', // Name of the join table
    joinColumn: {
      name: 'customer_id', // Column name in join table for Customer's PK
      referencedColumnName: 'id', // Column in Customer table
    },
    inverseJoinColumn: {
      name: 'conversation_id', // Column name in join table for Conversation's PK
      referencedColumnName: 'id', // Column in Conversation table
    },
  })
  conversations: Conversation[];

  @ManyToOne(() => Shop, (shop) => shop.customers, {
    nullable: true,
  })
  shop: Shop;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
