import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsObject,
  MaxLength,
  IsArray,
  IsInt,
} from 'class-validator';
import { AgentStatus, ModelProvider } from '../agents.entity';

export class CreateAgentDto {
  @IsNotEmpty({ message: 'Agent name cannot be empty.' })
  @IsString()
  @MaxLength(255)
  name: string;

  @IsNotEmpty()
  @IsEnum(ModelProvider, { message: 'Invalid model provider specified.' })
  modelProvider: ModelProvider;

  @IsNotEmpty({ message: 'Model name cannot be empty.' })
  @IsString()
  @MaxLength(255)
  modelName: string;

  @IsNotEmpty({ message: 'Prompt cannot be empty.' })
  @IsString()
  prompt: string;

  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @IsOptional()
  @IsObject({ message: 'Model config must be a valid object.' })
  modelConfig?: Record<string, any>;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  shopId?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  userIds?: number[];
}
