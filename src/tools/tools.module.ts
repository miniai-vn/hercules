import { Module } from '@nestjs/common';
import { ToolsService } from './tools.service';

@Module({
  providers: [ToolsService]
})
export class ToolsModule {}
