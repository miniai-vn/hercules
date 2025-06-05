import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Message } from '../messages/messages.entity';
import { Customer } from '../customers/customers.entity';
import { User } from '../users/users.entity';

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
    type: 'enum',
    enum: ReceiverType,
    name: 'receiver_type',
  })
  receiverType: ReceiverType;

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

  @ManyToOne(() => Customer, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'receiver_id',
    referencedColumnName: 'id',
  })
  customerReceiver?: Customer;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'receiver_id',
    referencedColumnName: 'id',
  })
  userReceiver?: User;

  // Helper methods
  getReceiver(): Customer | User | null {
    if (this.receiverType === ReceiverType.CUSTOMER && this.customerReceiver) {
      return this.customerReceiver;
    }
    if (this.receiverType === ReceiverType.USER && this.userReceiver) {
      return this.userReceiver;
    }
    return null;
  }

  getReceiverInfo(): {
    id: string;
    name: string;
    type: ReceiverType;
    avatar?: string;
    platform?: string;
  } | null {
    if (this.receiverType === ReceiverType.CUSTOMER && this.customerReceiver) {
      return {
        id: this.customerReceiver.id,
        name: this.customerReceiver.name || 'Unknown Customer',
        type: ReceiverType.CUSTOMER,
        avatar: this.customerReceiver.avatar,
        platform: this.customerReceiver.platform,
      };
    }

    if (this.receiverType === ReceiverType.USER && this.userReceiver) {
      return {
        id: this.userReceiver.id,
        name:
          this.userReceiver.name ||
          this.userReceiver.username ||
          'Support Agent',
        type: ReceiverType.USER,
        avatar: this.userReceiver.avatar,
        platform: 'internal',
      };
    }

    return null;
  }

  markAsRead(): void {
    this.isRead = true;
    this.readAt = new Date();
  }

  markAsDeleted(): void {
    this.isDeleted = true;
    this.deletedAt = new Date();
  }
}
