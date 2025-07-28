import * as dotenv from 'dotenv';
dotenv.config();

import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';
import { Shop } from 'src/shops/shops.entity';
import { Category } from 'src/categories/categories.entity';
import { Item } from 'src/items/items.entity';
import { Skus } from 'src/items/sku.entity';
import { Department } from 'src/departments/departments.entity';
import { Channel } from 'src/channels/channels.entity';
import { Customer } from 'src/customers/customers.entity';
import { Conversation } from 'src/conversations/conversations.entity';
import { Message } from 'src/messages/messages.entity';
import { User } from 'src/users/entities/users.entity';
import { ConversationMember } from 'src/conversation-members/conversation-members.entity';
import { Tag } from 'src/tags/tags.entity';
import { Role } from 'src/roles/roles.entity';
import { Permission } from 'src/permissions/permissions.entity';
import { UserDepartmentPermission } from 'src/user-dept-perm/user-dept-perm.entity';
import { UserDepartment } from 'src/users/entities/user-department.entity';
import { Resource } from 'src/resources/resources.entity';
import { Agent } from 'src/agents/agents.entity';
import { Template } from 'src/templates/templates.entity';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  return {
    type: 'postgres',
    host: configService.get('POSTGRES_HOST', 'localhost'),
    port: Number(configService.get('POSTGRES_PORT', 5432)),
    username: configService.get('POSTGRES_USER'),
    password: configService.get('POSTGRES_PASSWORD'),
    database: configService.get('POSTGRES_DB'),
    entities: [
      Shop,
      Category,
      Item,
      Skus,
      Channel,
      Department,
      Customer,
      Conversation,
      Message,
      User,
      ConversationMember,
      Tag,
      Role,
      Permission,
      UserDepartmentPermission,
      UserDepartment,
      Resource,
      Agent,
      Template,
    ],
    migrations: [
      isProduction
        ? join(__dirname, '..', '..', 'dist', 'migrations', '*.js')
        : join(__dirname, '../../', 'migrations', '*.ts'),
    ],
    synchronize: true,
  };
};

// Separate DataSource for CLI operations
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [
    Shop,
    Category,
    Item,
    Skus,
    Channel,
    Department,
    Customer,
    Conversation,
    Message,
    User,
    ConversationMember,
    Tag,
    Role,
    Permission,
    UserDepartmentPermission,
    UserDepartment,
    Resource,
    Agent,
    Template,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: true,
  logging: process.env.NODE_ENV !== 'production',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
