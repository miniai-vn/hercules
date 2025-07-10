import { Channel } from 'src/channels/channels.entity';
import { ConversationMember } from 'src/conversation-members/conversation-members.entity';
import { Tag } from 'src/tags/tags.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn
} from 'typeorm';
import { Message } from '../messages/messages.entity';

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
}

@Entity('conversations')
@Unique(['channel', 'externalId'])
export class Conversation {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'text', name: 'name' })
  name: string;

  @Column({
    type: 'varchar',
    name: 'type',
    default: ConversationType.DIRECT,
  })
  type: ConversationType;

  @Column({ type: 'text', nullable: true, name: 'external_id' })
  externalId?: string;

  @Column({ type: 'boolean', nullable: true, name: 'is_bot' })
  isBot?: boolean;

  @Column({
    type: 'text',
    nullable: true,
    name: 'avatar',
  })
  avatar: string;

  @Column({ type: 'text', nullable: true, name: 'content' })
  content?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @ManyToOne(() => Channel, (channel) => channel.conversations, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'channel_id' })
  channel: Channel;

  @OneToMany(() => Message, (message) => message.conversation, {
    cascade: true,
  })
  messages: Message[];

  @OneToMany(() => ConversationMember, (member) => member.conversation, {
    cascade: true,
  })
  members: ConversationMember[];

  @ManyToMany(() => Tag, (tag) => tag.conversations, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinTable({
    name: 'tag_conversations',
    joinColumn: { name: 'conversation_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
