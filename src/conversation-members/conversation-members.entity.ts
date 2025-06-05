import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Conversation } from '../conversations/conversations.entity';
import { Customer } from '../customers/customers.entity';
import { User } from '../users/users.entity';

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
    type: 'boolean',
    default: true,
    name: 'is_active',
  })
  isActive: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'member_settings',
  })
  memberSettings?: {
    notifications_enabled?: boolean;
    nickname?: string;
    role?: 'admin' | 'member' | 'viewer';
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  // Helper method to get participant info
  getParticipantInfo(): {
    id: string;
    name: string;
    type: ParticipantType;
    avatar?: string;
    platform?: string;
  } | null {
    if (this.participantType === ParticipantType.CUSTOMER && this.customer) {
      return {
        id: this.customer.id.toString(),
        name: this.customer.name || 'Unknown Customer',
        type: ParticipantType.CUSTOMER,
        avatar: this.customer.avatar,
        platform: this.customer.platform,
      };
    }

    if (this.participantType === ParticipantType.USER && this.user) {
      return {
        id: this.user.id,
        name: this.user.name || this.user.username || 'Support Agent',
        type: ParticipantType.USER,
        avatar: this.user.avatar,
        platform: this.user.platform,
      };
    }

    return null;
  }
}
