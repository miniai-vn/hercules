import { Module } from '@nestjs/common';
import { MaterialsController } from './materials.controller';
import { MeterialsService } from './materials.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Materials } from './entity/materials.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Materials])],
  controllers: [MaterialsController],
  providers: [MeterialsService],
  exports: [MeterialsService, TypeOrmModule],
})
export class MeterialsModule {}
