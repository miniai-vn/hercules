import { Chunks } from 'src/chunks/entity/chunks';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('link_materials')
export class LinkMaterialItem {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({
    name: 'meta_title',
    type: 'text',
    nullable: true,
  })
  metaTitle: string;

  @Column({
    name: 'meta_description',
    type: 'text',
    nullable: true,
  })
  metaDescription: string;

  @OneToMany(() => Chunks, (chunks) => chunks.file)
  chunks: Chunks[];

  @Column({
    type: 'date',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'create_at',
  })
  createAt: Date;

  @Column({
    type: 'date',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
    name: 'update_at',
  })
  updateAt: Date;
}
