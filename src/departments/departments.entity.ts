import { Agent } from 'src/agents/agents.entity';
import { Channel } from 'src/channels/channels.entity';
import { Resource } from 'src/resources/resources.entity';
import { Shop } from 'src/shops/shops.entity';
import { UserDepartment } from 'src/users/entities/user-department.entity';
import { User } from 'src/users/entities/users.entity';
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

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column()
  description: string;

  @ManyToOne(() => Shop, (shop) => shop.items)
  @JoinColumn({ name: 'shop_id' })
  shop: Shop;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  channels: Channel[];

  @OneToMany(
    () => UserDepartment,
    (userDepartment) => userDepartment.department,
  )
  users: User[];

  @OneToMany(() => Resource, (resource) => resource.department, {
    cascade: true,
  })
  resources: Resource[];

  @ManyToMany(() => Agent, (agent) => agent.departments)
  @JoinTable({
    name: 'department_agents',
    joinColumn: { name: 'department_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'agent_id', referencedColumnName: 'id' },
  })
  agents: Agent[];
}
