export type TokenDebugData = {
  app_id: string;
  type: string;
  application: string;
  data_access_expires_at: number; // timestamp (giây)
  expires_at: number; // timestamp (giây)
  is_valid: boolean;
  issued_at: number; // timestamp (giây)
  scopes: string[];
  user_id: string;
};

export type TokenDebugResponse = {
  data: TokenDebugData;
};
