import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('messages')
export class Messages {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', name: 'sender_type', nullable: false })
  senderType: string;

  @Column({ type: 'text', name: 'content_type', nullable: false })
  contentType: string;

  @Column({ type: 'text', name: 'content', nullable: true })
  content: string;

  @Column({ type: 'json', name: 'extra_content', nullable: true })
  extraContent: any;
  @Column({
    type: 'date',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'create_at',
  })
  createAt: Date;

  @Column({
    type: 'date',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'update_at',
  })
  updateAt: Date;
}
