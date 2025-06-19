export enum PermissionCode {
  // File
  FILE_CREATE = 'file.create',
  FILE_READ = 'file.read',
  FILE_UPDATE = 'file.update',
  FILE_DELETE = 'file.delete',
  FILE_DOWNLOAD = 'file.download',
  FILE_SHARE = 'file.share',
  FILE_ACCESS_SENSITIVE = 'file.access_sensitive',
  FILE_CHUNK = 'file.chunk',
  FILE_SYNC = 'file.sync',

  // Chunks
  CHUNK_CREATE = 'chunk.create',
  CHUNK_READ = 'chunk.read',
  CHUNK_DELETE = 'chunk.delete',
  CHUNK_UPDATE = 'chunk.update',

  // Chat
  CHAT_READ = 'chat.read',
  CHAT_CREATE = 'chat.create',
  CHAT_UPDATE = 'chat.update',
  CHAT_DELETE = 'chat.delete',
  CHAT_TRAIN = 'chat.train',
  CHAT_MANAGE_SETTINGS = 'chat.manage_settings',

  // User
  USER_CREATE = 'user.create',
  USER_READ = 'user.read',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  USER_BAN = 'user.ban',
  USER_ASSIGN_ROLE = 'user.assign_role',

  // Role & Permission
  ROLE_CREATE = 'role.create',
  ROLE_READ = 'role.read',
  ROLE_UPDATE = 'role.update',
  ROLE_DELETE = 'role.delete',
  PERMISSION_ASSIGN = 'permission.assign',
  PERMISSION_READ = 'permission.read',

  // Settings
  SETTING_READ = 'setting.read',
  SETTING_UPDATE = 'setting.update',
  SETTING_RESET = 'setting.reset',

  // Department
  DEPARTMENT_CREATE = 'department.create',
  DEPARTMENT_READ = 'department.read',
  DEPARTMENT_UPDATE = 'department.update',
  DEPARTMENT_DELETE = 'department.delete',
  DEPARTMENT_ASSIGN_USER = 'department.assign_user',
  DEPARTMENT_MANAGE_ROLES = 'department.manage_roles',

  // Conversations
  CONVERSATION_CREATE = 'conversation.create',
  CONVERSATION_READ = 'conversation.read',
  CONVERSATION_UPDATE = 'conversation.update',
  CONVERSATION_DELETE = 'conversation.delete',

  // Report
  REPORT_VIEW = 'report.read',

  // Domain
  DOMAIN_CREATE = 'domain.create',
  DOMAIN_READ = 'domain.read',
  DOMAIN_UPDATE = 'domain.update',
  DOMAIN_DELETE = 'domain.delete',

  // WhiteLabel
  WHITE_LABEL_CREATE = 'whitelabel.create',
  WHITE_LABEL_READ = 'whitelabel.read',
  WHITE_LABEL_UPDATE = 'whitelabel.update',
  WHITE_LABEL_DELETE = 'whitelabel.delete',

  // Channel
  CHANNEL_CREATE = 'channel.create',
  CHANNEL_READ = 'channel.read',
  CHANNEL_UPDATE = 'channel.update',
  CHANNEL_DELETE = 'channel.delete',

  // FAQ
  FAQ_CREATE = 'faq.create',
  FAQ_READ = 'faq.read',
  FAQ_UPDATE = 'faq.update',
  FAQ_DELETE = 'faq.delete',
}
