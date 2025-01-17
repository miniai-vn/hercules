import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const toolsDefined: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'SQLQueryExecutor',
      description:
        "This tool converts natural language queries into SQL and executes them on a database to retrieve or manipulate structured data. It allows users to efficiently search, retrieve, or interact with data using simple, conversational inputs. For example, if a user inputs 'Find all items in the work area,' the tool generates and executes the corresponding SQL query to return the results.",
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              "The user's natural language input, which will be interpreted and translated into an SQL query for execution.",
          },
        },
        required: ['question'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'RAGTool',
      description:
        "This tool retrieves information or answers specific questions from an uploaded document. It is designed to analyze the document's content and provide accurate, context-aware responses based on the user's query.",
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description:
              "The user's question about the uploaded document. This will be used to extract relevant information or insights from the file.",
          },
        },
        required: ['question'],
      },
    },
  },
];
