import * as dotenv from 'dotenv';
dotenv.config();

export const AGENT_SERVICE_CONFIG = {
  BASE_URL: process.env.AGENT_BASE_URL,
  ENDPOINTS: {
    GET_CHUNKS: '/api/chunks',
    GET_CHUNK: '/api/chunks/:id',
    UPDATE_CHUNK: '/api/chunks/:id',
    DELETE_CHUNK: '/api/chunks/:id',
    CREATE_CHUNK: '/api/chunks',
    ASK: '/api/chat/ask',
  },
} as const;
