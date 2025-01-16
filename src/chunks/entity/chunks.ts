import { FileMaterialItem } from 'src/material-items/entity/file.entity';
import { LinkMaterialItem } from 'src/material-items/entity/link.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('chunks')
export class Chunks {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: false })
  text: string;

  @ManyToOne(() => LinkMaterialItem, (link) => link.chunks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'link_id' })
  link: LinkMaterialItem;

  @ManyToOne(() => FileMaterialItem, (material) => material.chunks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'file_id' })
  file: FileMaterialItem;
}
