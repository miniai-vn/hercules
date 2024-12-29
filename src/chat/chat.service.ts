import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LlmServiceService } from 'src/llm-service/llm-service.service';
import { VectorServiceService } from 'src/vector-service/vector-service.service';
import { CreateMessageDto } from './dto/createMessage.dto';
import { Messages } from './entity/messages.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Messages)
    private readonly messagesRepository: Repository<Messages>,
    private readonly vectorServiceService: VectorServiceService,
    private readonly llmServiceService: LlmServiceService,
  ) {}

  async sendChat(input: CreateMessageDto) {
    try {
      const { content } = input;
      this.saveMessage({
        content: content,
        isBot: false,
      });
      const queruResult = await this.vectorServiceService.query(
        'material',
        content,
      );
      const llmResult = await this.llmServiceService.generateText(
        queruResult.flat()[0],
      );
      this.saveMessage({
        content: llmResult,
        isBot: true,
      });
      return { queruResult, llmResult };
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error in chat service',
      });
    }
  }

  async getMessages() {
    return await this.messagesRepository.find();
  }

  async saveMessage(input: CreateMessageDto) {
    const message = this.messagesRepository.create({
      ...input,
    });
    return await this.messagesRepository.save(message);
  }
}
