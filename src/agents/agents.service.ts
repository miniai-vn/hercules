import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { Agent, AgentStatus, ModelProvider } from './agents.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { QueryAgentDto } from './dto/query-agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  /**
   * Model configurations for different providers
   */
  private getDefaultModelConfig(provider: ModelProvider, modelName: string) {
    const configs = {
      [ModelProvider.OPENAI]: {
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      [ModelProvider.ANTHROPIC]: {
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
      },
      [ModelProvider.DEEPSEEK]: {
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.95,
      },
      [ModelProvider.GOOGLE]: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 1,
      },
      [ModelProvider.LOCAL]: {
        temperature: 0.7,
        max_tokens: 1000,
      },
    };

    return configs[provider] || {};
  }

  /**
   * Validate model name for specific provider
   */
  private validateModelName(
    provider: ModelProvider,
    modelName: string,
  ): boolean {
    const validModels = {
      [ModelProvider.OPENAI]: [
        'gpt-4',
        'gpt-4-turbo',
        'gpt-3.5-turbo',
        'gpt-4o',
        'gpt-4o-mini',
      ],
      [ModelProvider.ANTHROPIC]: [
        'claude-3-opus',
        'claude-3-sonnet',
        'claude-3-haiku',
        'claude-3-5-sonnet',
      ],
      [ModelProvider.DEEPSEEK]: [
        'deepseek-chat',
        'deepseek-coder',
        'deepseek-v2',
      ],
      [ModelProvider.GOOGLE]: [
        'gemini-pro',
        'gemini-pro-vision',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
      ],
      [ModelProvider.LOCAL]: [], // Allow any model name for local
    };

    if (provider === ModelProvider.LOCAL) return true;
    return validModels[provider]?.includes(modelName) || false;
  }

  async create(createAgentDto: CreateAgentDto): Promise<Agent> {
    // Validate model name
    if (
      !this.validateModelName(
        createAgentDto.modelProvider,
        createAgentDto.modelName,
      )
    ) {
      throw new BadRequestException(
        `Invalid model name '${createAgentDto.modelName}' for provider '${createAgentDto.modelProvider}'`,
      );
    }

    // Set default model config if not provided
    if (!createAgentDto.modelConfig) {
      createAgentDto.modelConfig = this.getDefaultModelConfig(
        createAgentDto.modelProvider,
        createAgentDto.modelName,
      );
    }

    const agent = this.agentRepository.create(createAgentDto);
    return await this.agentRepository.save(agent);
  }

  async findAll(queryDto: QueryAgentDto) {
    const { page, limit, search, status, modelProvider, shopId } = queryDto;

    const where: any = {
      ...(search && { name: Like(`%${name}%`) }),
      ...(status && { status }),
      ...(modelProvider && { modelProvider }),
      ...(shopId && { shop: { id: shopId } }),
    };
    const query: FindManyOptions<Agent> = {
      where,
      relations: ['shop', 'users'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    };

    const [agents, total] = await this.agentRepository.findAndCount(query);

    return {
      data: agents,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { id },
      relations: {
        shop: true,
        users: true,
      },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return agent;
  }

  async update(id: number, updateAgentDto: UpdateAgentDto): Promise<Agent> {
    const agent = await this.findOne(id);

    // Validate model name if being updated
    if (updateAgentDto.modelProvider && updateAgentDto.modelName) {
      if (
        !this.validateModelName(
          updateAgentDto.modelProvider,
          updateAgentDto.modelName,
        )
      ) {
        throw new BadRequestException(
          `Invalid model name '${updateAgentDto.modelName}' for provider '${updateAgentDto.modelProvider}'`,
        );
      }
    }

    Object.assign(agent, updateAgentDto);
    return await this.agentRepository.save(agent);
  }

  async remove(id: number): Promise<void> {
    const agent = await this.findOne(id);
    await this.agentRepository.softDelete(id);
  }

  async activate(id: number): Promise<Agent> {
    const agent = await this.findOne(id);
    agent.status = AgentStatus.ACTIVE;
    return await this.agentRepository.save(agent);
  }

  async deactivate(id: number): Promise<Agent> {
    const agent = await this.findOne(id);
    agent.status = AgentStatus.INACTIVE;
    return await this.agentRepository.save(agent);
  }

  async getAvailableModels(provider: ModelProvider) {
    const models = {
      [ModelProvider.OPENAI]: [
        { name: 'gpt-4o', description: 'GPT-4 Omni - Latest multimodal model' },
        { name: 'gpt-4-turbo', description: 'GPT-4 Turbo - Fast and capable' },
        { name: 'gpt-4', description: 'GPT-4 - Most capable model' },
        {
          name: 'gpt-3.5-turbo',
          description: 'GPT-3.5 Turbo - Fast and efficient',
        },
      ],
      [ModelProvider.ANTHROPIC]: [
        {
          name: 'claude-3-5-sonnet',
          description: 'Claude 3.5 Sonnet - Latest model',
        },
        { name: 'claude-3-opus', description: 'Claude 3 Opus - Most capable' },
        { name: 'claude-3-sonnet', description: 'Claude 3 Sonnet - Balanced' },
        { name: 'claude-3-haiku', description: 'Claude 3 Haiku - Fast' },
      ],
      [ModelProvider.DEEPSEEK]: [
        {
          name: 'deepseek-chat',
          description: 'DeepSeek Chat - General purpose',
        },
        {
          name: 'deepseek-coder',
          description: 'DeepSeek Coder - Code focused',
        },
        { name: 'deepseek-v2', description: 'DeepSeek V2 - Latest version' },
      ],
      [ModelProvider.GOOGLE]: [
        {
          name: 'gemini-1.5-pro',
          description: 'Gemini 1.5 Pro - Most capable',
        },
        { name: 'gemini-1.5-flash', description: 'Gemini 1.5 Flash - Fast' },
        { name: 'gemini-pro', description: 'Gemini Pro - Balanced' },
      ],
      [ModelProvider.LOCAL]: [
        { name: 'custom', description: 'Custom local model' },
      ],
    };

    return models[provider] || [];
  }
}
