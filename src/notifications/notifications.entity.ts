import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum NotificationType {
  ORDER = 'order',
  MESSAGE = 'message',
  SYSTEM = 'system',
  PROMOTION = 'promotion',
  REMINDER = 'reminder',
  ALERT = 'alert',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: false })
  userId: string;

  @Column({ type: 'text', nullable: false })
  title: string;

  @Column({ type: 'text', nullable: false })
  body: string;

  @Column({
    type: 'enum',
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any>;

  @Column({ type: 'boolean', name: 'is_read', default: false })
  isRead: boolean;

  @Column({
    name: 'read_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  readAt?: Date;

  // Relationships - commented out until User entity is available
  // @ManyToOne(() => User, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'user_id' })
  // user: User;
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
  })
  updatedAt: Date;
}
