import { Module } from '@nestjs/common';
import { SqlAgentService } from './sql-agent.service';
import { SqlAgentController } from './sql-agent.controller';

@Module({
  providers: [SqlAgentService],
  controllers: [SqlAgentController]
})
export class SqlAgentModule {}
