import { ChatOpenAI } from '@langchain/openai';

export const llmChatOpenAi = new ChatOpenAI({
  model: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY,
});
