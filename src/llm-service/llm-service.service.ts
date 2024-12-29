import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
export class LlmServiceService {
  private llm;
  prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `Edit the sentence based on the user's {input} to make it more appealing use Vietnamese only text`,
    ],
    ['human', '{input}'],
  ]);
  constructor() {
    this.llm = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-pro',
      temperature: 0,
      maxRetries: 2,
      apiKey: 'AIzaSyDh8Wh80utmvMpOhmM-QWNcfgc0ulcMHEk',
    });
  }

  async generateText(prompt: string) {
    const chain = this.prompt.pipe(this.llm);
    const result = (await chain.invoke({
      input: prompt,
    })) as { content: string };
    return result.content as string;
  }
}
