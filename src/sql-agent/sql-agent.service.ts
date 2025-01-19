import { SemanticSimilarityExampleSelector } from '@langchain/core/example_selectors';
import { FewShotPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { Annotation, StateGraph } from '@langchain/langgraph';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { createSqlQueryChain } from 'langchain/chains/sql_db';
import { SqlDatabase } from 'langchain/sql_db';
import { QuerySqlTool } from 'langchain/tools/sql';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { DataSource } from 'typeorm';
import { z } from 'zod';
import { itemPrompts } from './prompts';
import { llmChatOpenAi } from 'src/configs/openai';
import { tool } from '@langchain/core/tools';
@Injectable()
export class SqlAgentService {
  datasource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: 'miniai',
  });

  llm = llmChatOpenAi;

  InputStateAnnotation = Annotation.Root({
    question: Annotation<string>,
  });

  StateAnnotation = Annotation.Root({
    question: Annotation<string>,
    query: Annotation<string>,
    result: Annotation<string>,
    answer: Annotation<string>,
  });

  constructor() {
    this.getPrompts();
  }

  /*
   * Get instace graph
   */

  public getInstance = () => {
    const graph = new StateGraph(this.StateAnnotation)
      .addNode('writeQuery', this.writeQuery)
      .addNode('executeQuery', this.executeQuery)
      .addNode('generateAnswer', this.generateAnswer)
      .addEdge('__start__', 'writeQuery')
      .addEdge('writeQuery', 'executeQuery')
      .addEdge('executeQuery', 'generateAnswer')
      .addEdge('generateAnswer', '__end__')
      .compile();
    return graph;
  };

  /**
   * get  prompts
   */

  async getPrompts() {
    const examplePrompt = PromptTemplate.fromTemplate(
      `User input: {input}\nSQL Query: {query}`,
    );

    const examples = itemPrompts;
    const exampleSelector =
      await SemanticSimilarityExampleSelector.fromExamples<
        typeof MemoryVectorStore
      >(examples, new OpenAIEmbeddings(), MemoryVectorStore, {
        k: 5,
        inputKeys: ['input'],
      });

    const prompt = new FewShotPromptTemplate({
      exampleSelector,
      examplePrompt,
      prefix: `You are a PostgreSQL expert. Given an input question, create a syntactically correct PostgreSQL query to run.
              Unless otherwise specified, do not return more than {top_k} rows.

              All queries must include a reference to the column "shop_id" to filter or provide context, and the value of "shop_id" should be incorporated into the query.

              Here is the relevant table information:
              {table_info}

              Below are several examples of questions and their corresponding PostgreSQL queries.`,
      suffix: `User input: {input}\nShop ID: {shop_id}\nSQL query: `,
      inputVariables: ['input', 'top_k', 'table_info', 'shop_id'], // Required input variables
    });
    return prompt;
  }

  /**
   * get chain
   */

  async getChain() {
    const db = await this.getSqlDatabase();
    const prompt = await this.getPrompts();
    const chain = await createSqlQueryChain({
      db,
      llm: this.llm,
      prompt,
      dialect: 'postgres',
    });
    return chain;
  }
  /**
   * get database
   */
  async getSqlDatabase() {
    const db = await SqlDatabase.fromDataSourceParams({
      appDataSource: this.datasource,
      includesTables: ['Item'],
    });
    return db;
  }
  /**
   * generate anwser
   */
  generateAnswer = async (state: any) => {
    const promptValue =
      'Given the following user question, corresponding SQL query, ' +
      'and SQL result, answer the user question in Vietnamese.\n\n' +
      `Question: ${state.question}\n` +
      `SQL Query: ${state.query}\n` +
      `SQL Result: ${state.result}\n` +
      'Provide a concise and clear response in Vietnamese, and include the input list as part of the context for the answer.\n';
    const response = await this.llm.invoke(promptValue);
    return {
      answer: response.content as string,
      result: JSON.parse(state.result),
    };
  };
  /**
   * get  Query
   */
  async generateSqlQuery(question: string): Promise<{
    result: any;
    answer: string;
  }> {
    const result = await this.writeQuery({
      question,
    });

    const executeQueryResult = await this.executeQuery({
      question,
      query: result.query,
      result: '',
      answer: '',
    });

    const answerResult = await this.generateAnswer({
      question,
      query: result.query,
      result: executeQueryResult.result,
    });

    return answerResult;
  }

  /**
   * write SQL Query
   */

  writeQuery = async (state: typeof this.InputStateAnnotation.State) => {
    const db = await this.getSqlDatabase();

    const queryOutput = z.object({
      query: z.string().describe('Syntactically valid SQL query.'),
    });

    const chain = this.llm.withStructuredOutput(queryOutput);

    const queryPromptTemplate = await this.getPrompts();

    const promptValue = await queryPromptTemplate.invoke({
      top_k: 10,
      table_info: await db.getTableInfo(),
      input: state.question,
      shop_id: '9db28823-60d2-420c-bc10-e8a4ce9f51f4',
    });
    const result = await chain.invoke(promptValue);
    return { query: result.query };
  };

  /**
   * excute Query
   */
  executeQuery = async (state: typeof this.StateAnnotation.State) => {
    try {
      const db = await this.getSqlDatabase();

      const executeQueryTool = new QuerySqlTool(db);
      return { result: await executeQueryTool.invoke(state.query) };
    } catch (error) {}
  };

  /*
   * invoke
   */
  invoke = (q: string) => {
    const graph = this.getInstance();
    graph.invoke({ question: q });
  };

  /**
   * get Tool
   */
  getTool = () => {
    const sqlAgentTool = tool(
      async (input: { question: string }) => {
        return this.invoke(input.question);
      },
      {
        name: 'SQLAgentTool',
        schema: z.object({
          question: z.string(),
        }),
        description:
          'Công cụ này cho phép người dùng đặt câu hỏi về sản phẩm bằng tiếng Việt và tự động tạo truy vấn SQL tương ứng.',
      },
    );

    return sqlAgentTool;
  };
}
