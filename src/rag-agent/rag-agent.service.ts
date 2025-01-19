import { Chroma } from '@langchain/community/vectorstores/chroma';
import { Document } from '@langchain/core/documents';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Annotation, StateGraph } from '@langchain/langgraph';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { pull } from 'langchain/hub';
import { llmChatOpenAi } from 'src/configs/openai';
import { z } from 'zod';
import { tool } from '@langchain/core/tools';
@Injectable()
export class RagAgentService {
  InputStateAnnotation = Annotation.Root({
    question: Annotation<string>,
  });

  StateAnnotation = Annotation.Root({
    question: Annotation<string>,
    context: Annotation<Document[]>,
    answer: Annotation<string>,
  });

  embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
  });

  llm = llmChatOpenAi;

  graph;

  vectorStore = new Chroma(this.embeddings, {
    collectionName: 'a-test-collection',
  });

  constructor() {}

  public getInstance = () => {
    this.graph = new StateGraph(this.StateAnnotation)
      .addNode('retrieve', this.retrieve)
      .addNode('generate', this.generate)
      .addEdge('__start__', 'retrieve')
      .addEdge('retrieve', 'generate')
      .addEdge('generate', '__end__')
      .compile();
    return this.graph;
  };

  retrieve = async (state: typeof this.InputStateAnnotation.State) => {
    const retrievedDocs = await this.vectorStore.similaritySearch(
      state.question,
    );
    return { context: retrievedDocs };
  };

  generate = async (state: typeof this.StateAnnotation.State) => {
    const docsContent = state.context.map((doc) => doc.pageContent).join('\n');
    const promptTemplate = await pull<ChatPromptTemplate>('rlm/rag-prompt');
    const messages = await promptTemplate.invoke({
      question: state.question,
      context: docsContent,
    });
    const response = await this.llm.invoke(messages);
    return { answer: response.content };
  };

  invoke = (q: string) => {
    const graph = this.getInstance();
    graph.invoke(q);
  };

  getTool = () => {
    const ragTool = tool(
      async (input: { q: string }) => {
        return this.invoke(input.q);
      },

      {
        name: 'SQLAgentTool',
        schema: z.object({
          q: z.string(),
        }),
        description: `Generates an SQL query based on the user's input`,
      },
    );

    return ragTool;
  };
}
