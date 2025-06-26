import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsController } from './agents.controller';
import { Agent } from './agents.entity';
import { AgentsService } from './agents.service';

@Module({
  imports: [TypeOrmModule.forFeature([Agent])],
  providers: [AgentsService],
  controllers: [AgentsController],
  exports: [AgentsService],
})
export class AgentsModule {}
