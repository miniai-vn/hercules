import { ConversationMember } from 'src/conversation-members/conversation-members.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
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

  @Column({ type: 'text', nullable: true, name: 'external_id', unique: true })
  externalId?: string;

  @Column({ type: 'text', nullable: true, name: 'thumb' })
  thumb?: string;

  @Column({ type: 'text', array: true, nullable: true, name: 'file_url' })
  links: string[];

  @Column({ type: 'text', nullable: true, name: 'url' })
  url?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'sender_id' })
  senderId?: string;

  @Column({ type: 'text', nullable: true, name: 'content' })
  content?: string;

  @OneToMany(() => ConversationMember, (member) => member.lastMessage)
  lastMessagesMembers: ConversationMember[];

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @Column({ type: 'text', nullable: true, name: 'intent' })
  intent?: string;

  @Column({ type: 'jsonb', nullable: true, name: 'extra_data' })
  extraData?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true, name: 'token_usage' })
  tokenUsage?: Record<string, any>;

  @Column({
    name: 'read_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  readAt?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    nullable: true,
    type: 'timestamp with time zone',
  })
  deletedAt?: Date;
}
