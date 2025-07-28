import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { Template } from './templates.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Template])],
  providers: [TemplatesService],
  controllers: [TemplatesController],
})
export class TemplatesModule {}
