export type TConversationPageId = {
  data: TConversationResp[];
};

type TConversationResp = {
  id: string;
  link: string;
  updated_time: string;
};
