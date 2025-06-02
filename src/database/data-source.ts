import { DataSource } from 'typeorm';
import { Shop } from 'src/shops/shops.entity';
import { Item } from 'src/items/items.entity';
import { Channel } from 'src/channels/channels.entity';
import { Department } from 'src/departments/departments.entity';
import { Category } from 'src/categories/categories.entity';
import * as dotenv from 'dotenv';
import { Skus } from 'src/items/sku.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [Shop, Category, Item, Skus, Channel, Department],
  // migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
