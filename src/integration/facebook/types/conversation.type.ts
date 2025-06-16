export interface IConversationPageId {
  data: IConversationResp[];
}

interface IConversationResp {
  id: string;
  link: string;
  updated_time: string;
}
