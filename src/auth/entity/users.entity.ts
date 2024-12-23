import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true, name: 'username' })
  username: string;

  @Column({ type: 'text', name: 'password' })
  password: string;
}
