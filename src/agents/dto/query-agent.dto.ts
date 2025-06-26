import { IsOptional, IsEnum, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { AgentStatus, ModelProvider } from '../agents.entity';

export class QueryAgentDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(AgentStatus)
  status?: AgentStatus;

  @IsOptional()
  @IsEnum(ModelProvider)
  modelProvider?: ModelProvider;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shopId?: number;
}
