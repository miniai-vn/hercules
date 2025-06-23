export type TFacebookMessage = {
  id: string;
  message: string;
  from: { id: string; name: string; email: string };
  to: { data: { id: string; name: string; email: string }[] };
};
