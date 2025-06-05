import {
  ConversationMember,
  ParticipantType,
} from 'src/conversation-members/conversation-members.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { Message } from '../messages/messages.entity'; // Ensure path is correct

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

  // Assuming you still have a OneToMany with Message
  @OneToMany(() => Message, (message) => message.conversation, {
    cascade: true,
  })
  messages: Message[];

  @OneToMany(() => ConversationMember, (member) => member.conversation, {
    cascade: true,
  })
  members: ConversationMember[];

  // Helper method to get active participants
  getActiveParticipants(): ConversationMember[] {
    return (
      this.members?.filter((member) => member.isActive && !member.leftAt) || []
    );
  }

  // Helper method to get customers only
  getCustomerParticipants(): ConversationMember[] {
    return this.getActiveParticipants().filter(
      (member) => member.participantType === ParticipantType.CUSTOMER,
    );
  }

  // Helper method to get users only
  getUserParticipants(): ConversationMember[] {
    return this.getActiveParticipants().filter(
      (member) => member.participantType === ParticipantType.USER,
    );
  }
}
