import { Message } from 'src/messages/messages.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Conversation } from '../conversations/conversations.entity';
import { Customer } from '../customers/customers.entity';
import { User } from '../users/entities/users.entity';

export enum ParticipantType {
  CUSTOMER = 'customer',
  USER = 'user',
}

@Entity('conversation_members')
export class ConversationMember {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'number', name: 'conversation_id' })
  conversationId: number;

  @ManyToOne(() => Conversation, (conversation) => conversation.members, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({
    type: 'varchar',
    name: 'participant_type',
  })
  participantType: string;

  @Column({ type: 'uuid', nullable: true, name: 'customer_id' })
  customerId?: string;

  @ManyToOne(() => Customer, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer;

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId?: string;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Message, (message) => message.lastMessagesMembers, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'last_message_id' })
  lastMessage: Message;

  @Column({ type: 'int', nullable: true, name: 'unread_count', default: 0 })
  unreadCount?: number;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'joined_at',
  })
  joinedAt?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'left_at',
  })
  leftAt?: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'member_settings',
  })
  memberSettings?: {
    notifications_enabled?: boolean;
    nickname?: string;
    role?: 'admin' | 'member' | 'viewer' | 'customer';
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
