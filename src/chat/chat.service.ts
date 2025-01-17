import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMessageDto } from './dto/createMessages.dto';
import { Messages } from './entity/message';
import { SqlAgentService } from 'src/sql-agent/sql-agent.service';
import { ChatOpenAI } from '@langchain/openai';
import { toolsDefined } from 'src/tools/tool-model';

@Injectable()
export class ChatService {
  llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0,
    apiKey: process.env.OPENAI_API_KEY,
  });

  llmWithTools = this.llm.bindTools(toolsDefined);
  constructor(
    @InjectRepository(Messages)
    private readonly messagesRepository: Repository<Messages>,
    private readonly sqlService: SqlAgentService,
  ) {}
  async createMessage(createMessageDto: CreateMessageDto): Promise<Messages> {
    const message = new Messages();
    message.senderType = createMessageDto.senderType;
    message.contentType = createMessageDto.contentType;
    message.content = createMessageDto.content;
    message.extraContent = createMessageDto.extraContent;
    return this.messagesRepository.save(message);
  }
  async findAll(): Promise<Messages[]> {
    return this.messagesRepository.find();
  }

  async chat(content: string) {
    try {
      const res = await this.llmWithTools.invoke(content);

      console.log(res['tool_calls']);
      // await this.createMessage({
      //   content,
      //   contentType: 'text',
      //   senderType: 'user',
      // });

      // const answer = await this.sqlService.generateSqlQuery(content);

      // await this.createMessage({
      //   content: answer.answer,
      //   extraContent: answer.result,
      //   contentType: 'text',
      //   senderType: 'assitance',
      // });

      // const history = await this.findAll();

      return [];
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException({
        message: error.message,
      });
    }
  }
}
