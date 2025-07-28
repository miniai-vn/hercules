import { channel } from 'diagnostics_channel';
import { Channel } from 'src/channels/channels.entity';
import { Shop } from 'src/shops/shops.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('template')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => Channel, (channel) => channel.templates, { nullable: true })
  @JoinColumn({ name: 'channel_id' })
  channel?: Channel;

  @ManyToOne(() => Shop, (shop) => shop.templates, { nullable: true })
  @JoinColumn({ name: 'shop_id' })
  shop?: Shop;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
