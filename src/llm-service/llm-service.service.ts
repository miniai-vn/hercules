import { ChatPromptTemplate } from '@langchain/core/prompts';
import { tool } from '@langchain/core/tools';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `Edit the sentence based on the user's {input} to make it more appealing use Vietnamese only text`,
  ],
  ['human', '{input}'],
]);
@Injectable()
export class LlmServiceService {
  private llm;
  prompt = prompt;
  constructor() {}

  async generateText(prompt: string) {
    const chain = this.prompt.pipe(this.llm);
    const result = (await chain.invoke({
      input: prompt,
    })) as { content: { text: string } };
    const text = result.content[0].text;

    return text;
  }

  async callTool(prompt: string) {
    await this.generateTools();
    const result = await this.llm.invoke([['human', prompt]]);
    console.log(result);
    return {
      tool: result.tool_calls?.[0]?.['name'],
    };
  }

  async generateTools() {
    const materials = [
      {
        name: 'python_tools',
        description:
          'Hữu dụng khi tìm kiếm thông tin về ngôn ngữ lập trình python',
      },
      {
        name: 'js_tools',
        description:
          'Hữu dụng khi tìm kiếm thông tin về ngôn ngữ lập trình javascript',
      },
    ];
    const tools: any = await Promise.all(
      materials.map((material) => {
        return tool(
          (_) => {
            return 'The search result is xyz...';
          },
          {
            name: material?.name,
            description: material?.description,
            schema: z.object({
              query: z.string().describe('The URL of the webpage to search.'),
            }),
          },
        );
      }),
    );
    // tools.push(searchRetrievalTool);
    this.llm = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-pro',
      temperature: 0,
      maxRetries: 2,
      apiKey: 'AIzaSyDh8Wh80utmvMpOhmM-QWNcfgc0ulcMHEk',
    }).bindTools(tools);
  }
}
