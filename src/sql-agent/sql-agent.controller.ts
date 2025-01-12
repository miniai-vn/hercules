import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SqlAgentService } from './sql-agent.service';

@Controller('sql-agent')
export class SqlAgentController {
  constructor(private readonly sqlAgentService: SqlAgentService) {}

  @Post('/get-sql')
  @HttpCode(HttpStatus.OK)
  async send(@Body() input: any) {
    return await this.sqlAgentService.generateSqlQuery(input.question);
  }
}
