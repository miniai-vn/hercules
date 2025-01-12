import { Users } from 'src/auth/entity/users.entity';
import { Conversation } from 'src/conversations/entities/conversation.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Conversation, (conversation) => conversation.id, {
    nullable: false,
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @ManyToOne(() => Users, (user) => user.id, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @Column({ type: 'text', nullable: false })
  text: string;

  @Column({ type: 'enum', enum: ['user', 'bot'], nullable: false })
  type: 'user' | 'bot';

  @Column({ type: 'float', array: true, nullable: true })
  embedding: number[];

  @CreateDateColumn()
  timestamp: Date;
}
