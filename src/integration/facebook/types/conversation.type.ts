export type TParticipant = {
  id: string;
  name: string;
  email?: string;
};

export type TConversationResp = {
  id: string;
  link?: string;
  updated_time?: string;
  participants: {
    data: TParticipant[];
  };
};

export type TConversationPageId = {
  snippet: string;
  id: string;
  participants: {
    data: Array<{
      id: string;
      name?: string;
      // add other participant properties if needed
    }>;
  };
};
