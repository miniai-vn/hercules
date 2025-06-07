import { ConversationMember } from 'src/conversation-members/conversation-members.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Conversation } from '../conversations/conversations.entity'; // Adjust path as needed

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({
    type: 'text',
    name: 'sender_type',
  })
  senderType: String;

  @Column({ type: 'text', name: 'content_type' })
  contentType: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'sender_id' })
  senderId?: string; // ID of the sender in the conversation

  @Column({ type: 'text', nullable: true, name: 'content' })
  content?: string;

  @OneToOne(() => ConversationMember, {
    nullable: true,
    cascade: true,
  })
  conversationMember?: ConversationMember;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE', // Matches SQLAlchemy
    nullable: false,
  })
  @JoinColumn({ name: 'conversation_id' }) // Specifies the foreign key column
  conversation: Conversation;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ type: 'text', nullable: true, name: 'intent' })
  intent?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'extra_data' }) // Using jsonb for dictionary-like data
  extraData?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'token_usage' }) // Using jsonb for dictionary-like data
  tokenUsage?: Record<string, any>;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    nullable: true,
    type: 'timestamp with time zone',
  })
  deletedAt?: Date;
}
