import { Materials } from 'src/materials/entity/materials.entity';
import { Message } from 'src/messages/entities/messages';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true, name: 'username' })
  username: string;

  @Column({ type: 'text', name: 'password' })
  password: string;

  // one to many messages
  @OneToMany(() => Message, (message) => message.id)
  messages: Message[];
}
