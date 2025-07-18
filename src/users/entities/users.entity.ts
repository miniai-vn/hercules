import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from '../../departments/departments.entity';
import { Shop } from '../../shops/shops.entity';
import { Channel } from 'src/channels/channels.entity';
import { Role } from 'src/roles/roles.entity';
import { UserDepartmentPermission } from 'src/user-dept-perm/user-dept-perm.entity';
import { UserDepartment } from './user-department.entity';
import { Agent } from 'src/agents/agents.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({
    type: 'varchar',
    length: 80,
    unique: true,
    nullable: false,
    name: 'username',
  })
  username: string;

  @Column({
    type: 'text',
    name: 'password',
    nullable: true,
  })
  password: string;

  @Column({
    type: 'varchar',
    length: 80,
    unique: true,
    nullable: true,
    name: 'email',
  })
  email?: string;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
    name: 'phone',
  })
  phone?: string;

  @Column({
    type: 'varchar',
    length: 80,
    nullable: true,
    name: 'name',
  })
  name?: string;

  @Column({
    type: 'varchar',
    length: 256,
    nullable: true,
    name: 'avatar',
  })
  avatar?: string;

  @ManyToOne(() => Shop, (shop) => shop.admins, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  // Many-to-Many relationship with Departments
  @ManyToMany(() => Department, (department) => department.users, {
    cascade: true,
  })
  @OneToMany(() => UserDepartment, (userDepartment) => userDepartment.user)
  departments: UserDepartment[];

  @ManyToMany(() => Channel, (channel) => channel.users)
  @JoinTable({
    name: 'user_channels',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'channel_id', referencedColumnName: 'id' },
  })
  channels: Channel[];

  //
  @ManyToMany(() => Agent, (agent) => agent.users)
  @JoinTable({
    name: 'user_agents',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'agent_id', referencedColumnName: 'id' },
  })
  agents: Agent[];

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

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  deletedAt?: Date;

  @ManyToMany(() => Role, (role) => role.users, {
    cascade: true,
  })
  @JoinTable({
    name: 'user_role',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @OneToMany(() => UserDepartmentPermission, (udp) => udp.user, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  userDepartmentPermissions: UserDepartmentPermission[];
}
