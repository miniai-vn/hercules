import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { AgentsService } from './agents.service';

import { QueryAgentDto } from './dto/query-agent.dto';
import { ModelProvider } from './agents.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  create(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.create(createAgentDto);
  }

  @Get()
  findAll(@Query() queryDto: QueryAgentDto) {
    return this.agentsService.findAll(queryDto);
  }

  @Get('models/:provider')
  getAvailableModels(@Param('provider') provider: ModelProvider) {
    return this.agentsService.getAvailableModels(provider);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.agentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAgentDto: UpdateAgentDto,
  ) {
    return this.agentsService.update(id, updateAgentDto);
  }

  @Put(':id/activate')
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.agentsService.activate(id);
  }

  @Put(':id/deactivate')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.agentsService.deactivate(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.agentsService.remove(id);
  }
}
