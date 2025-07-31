import { ConversationMember } from 'src/conversation-members/conversation-members.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Conversation } from '../conversations/conversations.entity'; // Adjust path as needed
import { MessageType } from './dto/messages.dto';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ type: 'text', name: 'type', default: MessageType.receive })
  type: MessageType;

  @Column({
    type: 'text',
    name: 'sender_type',
  })
  senderType: String;

  @Column({ type: 'text', name: 'content_type' })
  contentType: string;

  @Column({ type: 'text', nullable: true, name: 'external_id', unique: true })
  externalId?: string;

  @Column({ type: 'text', array: true, nullable: true, name: 'links' })
  links: string[];

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
