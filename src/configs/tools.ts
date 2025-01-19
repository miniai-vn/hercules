export const SQLAgent = {
  type: 'function',
  function: {
    name: 'SQLAgent',
    description:
      'This tool is used to generate SQL queries based on user inquiries about product information..',
    parameters: {
      type: 'object',
      properties: {
        q: {
          description: 'The query string provided by the user not SQL Query',
        },
      },
      required: ['q'],
    },
  },
};

export const RAGService = {
  type: 'function',
  function: {
    name: 'RAGService',
    description:
      'This tool is used to query the knowledge base about the company.',
    parameters: {
      type: 'object',
      properties: {
        q: {
          description: 'The query string provided by the user not SQL Query',
        },
      },
      required: ['q'],
    },
  },
};
