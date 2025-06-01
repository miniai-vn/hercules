import { DataSource } from 'typeorm';
import { Shop } from 'src/shops/entities/shop';
import { Item } from 'src/items/entities/item';
import { Skus } from 'src/items/entities/sku';
import { Channel } from 'src/channels/channels.entity';
import { Department } from 'src/departments/departments.entity';
import { Category } from 'src/categories/categories.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_NAME,
  entities: [Shop, Category, Item, Skus, Channel, Department],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

// "scripts": {
//   "typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js",
//   "migration:generate": "npm run typeorm -- migration:generate -d src/database/data-source.ts",
//   "migration:create": "npm run typeorm -- migration:create",
//   "migration:run": "npm run typeorm -- migration:run -d src/database/data-source.ts",
//   "migration:revert": "npm run typeorm -- migration:revert -d src/database/data-source.ts",
//   "migration:show": "npm run typeorm -- migration:show -d src/database/data-source.ts"
// }
