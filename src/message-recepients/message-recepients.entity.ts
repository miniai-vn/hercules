import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Message } from '../messages/messages.entity';

export enum ReceiverType {
  USER = 'user',
  CUSTOMER = 'customer',
}

@Entity('message_recipients')
export class MessageRecipient {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ type: 'uuid', name: 'message_id' })
  messageId: string;

  @Column({
    type: 'varchar',
    name: 'receiver_type',
  })
  receiverType: string;

  @Column({ type: 'uuid', name: 'receiver_id' })
  receiverId: string;

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  isRead: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'read_at',
  })
  readAt?: Date;

  @Column({ type: 'boolean', default: false, name: 'is_deleted' })
  isDeleted: boolean;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    name: 'deleted_at',
  })
  deletedAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  markAsRead(): void {
    this.isRead = true;
    this.readAt = new Date();
  }

  markAsDeleted(): void {
    this.isDeleted = true;
    this.deletedAt = new Date();
  }
}
