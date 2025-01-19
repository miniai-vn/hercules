import { HumanMessage } from '@langchain/core/messages';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { llmChatOpenAi } from 'src/configs/openai';
import { RAGService, SQLAgent } from 'src/configs/tools';
import { SqlAgentService } from 'src/sql-agent/sql-agent.service';
import { Repository } from 'typeorm';
import { CreateMessageDto } from './dto/createMessages.dto';
import { Messages } from './entity/message';

@Injectable()
export class ChatService {
  llmWithTools;
  toolsByName;
  constructor(
    @InjectRepository(Messages)
    private readonly messagesRepository: Repository<Messages>,
    private readonly sqlService: SqlAgentService,
  ) {
    this.llmWithTools = llmChatOpenAi.bind({
      tools: [SQLAgent, RAGService],
    });
    this.toolsByName = {
      SQLAgent: this.sqlService,
    };
  }

  /*
   * store message in database
   */

  async createMessage(createMessageDto: CreateMessageDto): Promise<Messages> {
    const message = new Messages();
    message.senderType = createMessageDto.senderType;
    message.contentType = createMessageDto.contentType;
    message.content = createMessageDto.content;
    message.extraContent = createMessageDto.extraContent;
    return this.messagesRepository.save(message);
  }

  /*
   * get all messages from database
   */

  async findAll(): Promise<Messages[]> {
    return this.messagesRepository.find();
  }

  /*
   * chat
   */

  async chat(content: string) {
    try {
      const newMessage = [new HumanMessage(content)];
      const aiMessage = await this.llmWithTools.invoke(newMessage);
      for (const toolCall of aiMessage.tool_calls) {
        const tool = this.toolsByName[toolCall.name];
        const answer = await tool.generateSqlQuery(content);

        await this.createMessage({
          content,
          contentType: 'text',
          senderType: 'user',
        });

        await this.createMessage({
          content: answer.answer,
          extraContent: answer.result,
          contentType: 'text',
          senderType: 'assitance',
        });
      }
      const history = await this.findAll();

      return history;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException({
        message: error.message,
      });
    }
  }
}
