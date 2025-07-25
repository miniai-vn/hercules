export enum ChatSocketEvent {
  MESSAGE = 'message',
  MESSAGE_READ = 'message_read',
  MESSAGE_EDITED = 'message_edited',
  MESSAGE_DELETED = 'message_deleted',
  MESSAGE_REACTION = 'message_reaction',
  MESSAGE_REACTION_REMOVED = 'message_reaction_removed',
  MESSAGE_DELIVERED = 'message_delivered',
  TYPING = 'typing',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_TYPING = 'user_typing',
  USER_STOPPED_TYPING = 'user_stopped_typing',
  CHAT_CREATED = 'chat_created',
  CHAT_UPDATED = 'chat_updated',
  CHAT_DELETED = 'chat_deleted',
}

export enum ChatAIEvent {
    AI_REPLY_REQUESTED = 'ai_reply_requested',
    AI_REPLY_GENERATED = 'ai_reply_generated',
    AI_REPLY_FAILED = 'ai_reply_failed',
    AI_REPLY_RETRY = 'ai_reply_retry',
    AI_REPLY_CANCELLED = 'ai_reply_cancelled',
}
