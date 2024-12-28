import { Materials } from 'src/materials/entity/materials.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true, name: 'username' })
  username: string;

  @Column({ type: 'text', name: 'password' })
  password: string;

  // one to many meterial
  @OneToMany(() => Materials, (meterials) => meterials.user)
  meterials: Materials[];
}
