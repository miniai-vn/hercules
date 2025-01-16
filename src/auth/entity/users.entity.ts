import { FileMaterialItem } from 'src/material-items/entity/file.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true, name: 'username' })
  username: string;

  @Column({ type: 'text', name: 'password' })
  password: string;

  // one to many messages
  @OneToMany(
    () => FileMaterialItem,
    (fileMaterialItem) => fileMaterialItem.user,
  )
  fileMaterialItems: FileMaterialItem[];
}
