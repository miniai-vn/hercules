import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { Agent, AgentStatus, ModelProvider } from './agents.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { QueryAgentDto } from './dto/query-agent.dto';
import { ChannelsService } from 'src/channels/channels.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    private readonly channelService: ChannelsService,
    private readonly userService: UsersService, // Assuming userService is used for user-related operations
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
        top_k: 40,
      },
      [ModelProvider.DEEPSEEK]: {
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.95,
        top_k: 40,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      [ModelProvider.GOOGLE]: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 1,
        topK: 40,
      },
      [ModelProvider.LOCAL]: {
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9,
        top_k: 40,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
    };

    return configs[provider] || {};
  }

  /**
   * Merge user-provided config with defaults
   */
  private mergeModelConfig(
    provider: ModelProvider,
    modelName: string,
    userConfig?: any,
  ): any {
    const defaultConfig = this.getDefaultModelConfig(provider, modelName);

    if (!userConfig) {
      return defaultConfig;
    }

    // Merge user config with defaults, user config takes precedence
    return {
      ...defaultConfig,
      ...userConfig,
    };
  }

  /**
   * Validate and normalize model config for specific provider
   */
  private validateAndNormalizeModelConfig(
    provider: ModelProvider,
    config: any,
  ): any {
    const normalized = { ...config };

    // Validate ranges
    if (normalized.temperature !== undefined) {
      if (normalized.temperature < 0 || normalized.temperature > 2) {
        throw new BadRequestException('Temperature must be between 0 and 2');
      }
    }

    if (normalized.top_p !== undefined || normalized.topP !== undefined) {
      const topP = normalized.top_p || normalized.topP;
      if (topP < 0 || topP > 1) {
        throw new BadRequestException('top_p must be between 0 and 1');
      }
    }

    if (
      normalized.max_tokens !== undefined ||
      normalized.maxOutputTokens !== undefined
    ) {
      const maxTokens = normalized.max_tokens || normalized.maxOutputTokens;
      if (maxTokens < 1 || maxTokens > 4096) {
        throw new BadRequestException('max_tokens must be between 1 and 4096');
      }
    }

    // Provider-specific normalization
    switch (provider) {
      case ModelProvider.GOOGLE:
        // Convert snake_case to camelCase for Google
        if (normalized.max_tokens) {
          normalized.maxOutputTokens = normalized.max_tokens;
          delete normalized.max_tokens;
        }
        if (normalized.top_p) {
          normalized.topP = normalized.top_p;
          delete normalized.top_p;
        }
        if (normalized.top_k) {
          normalized.topK = normalized.top_k;
          delete normalized.top_k;
        }
        // Remove unsupported parameters
        delete normalized.frequency_penalty;
        delete normalized.presence_penalty;
        break;

      case ModelProvider.ANTHROPIC:
        // Remove unsupported parameters
        delete normalized.frequency_penalty;
        delete normalized.presence_penalty;
        delete normalized.topK;
        delete normalized.maxOutputTokens;
        delete normalized.topP;
        break;

      case ModelProvider.OPENAI:
        // Remove unsupported parameters
        delete normalized.top_k;
        delete normalized.topK;
        delete normalized.maxOutputTokens;
        delete normalized.topP;
        break;

      default:
        break;
    }

    return normalized;
  }

  async create(createAgentDto: CreateAgentDto): Promise<Agent> {
    // Merge user config with defaults and validate
    const mergedConfig = this.mergeModelConfig(
      createAgentDto.modelProvider.toLowerCase() as ModelProvider,
      createAgentDto.modelName.toLowerCase(),
      createAgentDto.modelConfig,
    );

    const normalizedConfig = this.validateAndNormalizeModelConfig(
      createAgentDto.modelProvider.toLowerCase() as ModelProvider,
      mergedConfig,
    );

    const agent = this.agentRepository.create({
      ...createAgentDto,
      modelConfig: normalizedConfig,
      departments: createAgentDto?.departmentIds?.map((id) => ({ id })),
    });

    return await this.agentRepository.save(agent);
  }

  async findAll(queryDto: QueryAgentDto) {
    const { page, limit, search, status, modelProvider, shopId } = queryDto;

    const where: any = {
      ...(search && { name: Like(`%${search}%`) }),
      ...(status && { status }),
      ...(modelProvider && { modelProvider }),
      ...(shopId && { shop: { id: shopId } }),
    };
    const query: FindManyOptions<Agent> = {
      where,
      relations: {
        shop: true,
        users: true,
        departments: true,
        channels: true, // Include channels relation
      },
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
        departments: true, // Include departments relation
      },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return agent;
  }

  async update(id: number, updateAgentDto: UpdateAgentDto): Promise<Agent> {
    const agent = await this.findOne(id);

    // Handle model config update
    if (updateAgentDto.modelConfig) {
      const provider = (updateAgentDto.modelProvider ||
        agent.modelProvider) as ModelProvider;
      const modelName = updateAgentDto.modelName || agent.modelName;

      // Merge with existing config if partially updating
      const currentConfig = agent.modelConfig || {};
      const mergedConfig = { ...currentConfig, ...updateAgentDto.modelConfig };

      updateAgentDto.modelConfig = this.validateAndNormalizeModelConfig(
        provider,
        mergedConfig,
      );
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

  async addChannel(id: number, channelIds: number[]) {
    try {
      const agent = await this.findOne(id);
      const channels = await Promise.all(
        channelIds.map((channelId) => this.channelService.getOne(channelId)),
      );
      agent.channels = channels; // Assuming channels are entities with at least an id
      return await this.agentRepository.save(agent);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to add channels to agent `,
      );
    }
  }

  async addUser(id: number, userIds: string[]) {
    try {
      const agent = await this.findOne(id);
      const users = await Promise.all(
        userIds.map((userId) => this.userService.findOne(userId)),
      );
      agent.users = users; // Assuming users are entities with at least an id
      return await this.agentRepository.save(agent);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to add users to agent `);
    }
  }

  async findByChannelId(channelId: number): Promise<Agent[]> {
    const agents = await this.agentRepository.find({
      where: {
        channels: { id: channelId },
      },
      relations: ['channels', 'users', 'departments'],
    });

    return agents;
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
