import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from 'src/auth/gaurds/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/gaurds/permission.guard';
import { ModelProvider } from './agents.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { QueryAgentDto } from './dto/query-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { RequirePermissions } from 'src/common/decorators/permissions.decorator';
import { PermissionCode } from 'src/common/enums/permission.enum';

@ApiTags('Agents')
@Controller('agents')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, PermissionsGuard) // Apply global guards if needed, e.g., AuthGuard
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @RequirePermissions(PermissionCode.AGENT_CREATE)
  @ApiBody({
    type: CreateAgentDto,
    examples: {
      example1: {
        summary: 'Create Agent Example',
        value: {
          name: 'Example Agent',
          description: 'This is an example agent.',
          modelProvider: ModelProvider.OPENAI,
          modelName: 'gpt-3.5-turbo',
          instructions: 'Provide helpful responses.',
        },
      },
    },
  })
  create(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.create(createAgentDto);
  }

  @Get()
  @RequirePermissions(PermissionCode.AGENT_READ)
  @ApiOperation({ summary: 'Get all agents with filtering and pagination' })
  @ApiQuery({ type: QueryAgentDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Agents retrieved successfully',
  })
  findAll(@Query() queryDto: QueryAgentDto) {
    return this.agentsService.findAll(queryDto);
  }

  @Get('models/:provider')
  @RequirePermissions(PermissionCode.AGENT_READ)
  @ApiOperation({ summary: 'Get available models for a provider' })
  @ApiParam({
    name: 'provider',
    description: 'Model provider',
    enum: ModelProvider,
  })
  @ApiResponse({
    status: 200,
    description: 'Available models retrieved successfully',
  })
  getAvailableModels(@Param('provider') provider: ModelProvider) {
    return this.agentsService.getAvailableModels(provider);
  }

  @Get(':id')
  @RequirePermissions(PermissionCode.AGENT_READ)
  @ApiOperation({ summary: 'Get agent by ID' })
  @ApiParam({
    name: 'id',
    description: 'Agent ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Agent retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Agent not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.agentsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionCode.AGENT_UPDATE)
  @ApiOperation({ summary: 'Update agent by ID' })
  @ApiParam({
    name: 'id',
    description: 'Agent ID',
    type: 'number',
    example: 1,
  })
  @ApiBody({ type: UpdateAgentDto })
  @ApiResponse({
    status: 200,
    description: 'Agent updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Agent not found',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAgentDto: UpdateAgentDto,
  ) {
    return this.agentsService.update(id, updateAgentDto);
  }

  @Put(':id/activate')
  @RequirePermissions(PermissionCode.AGENT_UPDATE)
  @ApiOperation({ summary: 'Activate agent by ID' })
  @ApiParam({
    name: 'id',
    description: 'Agent ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Agent activated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Agent not found',
  })
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.agentsService.activate(id);
  }

  @Put(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate agent by ID' })
  @ApiParam({
    name: 'id',
    description: 'Agent ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Agent deactivated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Agent not found',
  })
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.agentsService.deactivate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agent by ID' })
  @ApiParam({
    name: 'id',
    description: 'Agent ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Agent deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Agent not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.agentsService.remove(id);
  }
}
