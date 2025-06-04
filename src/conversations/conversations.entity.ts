import { Customer } from '../customers/customers.entity'; // Ensure path is correct
import { Message } from '../messages/messages.entity'; // Ensure path is correct
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'text', name: 'name' })
  name: string;

  @Column({
    type: 'varchar',
    name: 'type',
  })
  type: ConversationType;

  @Column({ type: 'text', nullable: true, name: 'content' })
  content?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;


  @Column({type: 'varchar', length: 255, nullable: true, name: 'channel'})
  channel?: string; // e.g., Zalo, Facebook, TikTok

  // Assuming you still have a OneToMany with Message
  @OneToMany(() => Message, (message) => message.conversation, {
    cascade: true,
  })
  messages: Message[];

  // ManyToMany relationship with Customer
  @ManyToMany(() => Customer, (customer) => customer.conversations)
  @JoinTable({
    name: 'conversation_customers', // Name of the join table
    joinColumn: {
      name: 'conversation_id', // Column name in join table for Conversation's PK
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'customer_id', // Column name in join table for Customer's PK
      referencedColumnName: 'id',
    },
  })
  customers: Customer[]; // Changed property name from 'messages' to 'customers'

  
}
