export type TPageInfo = {
  id: string;
  name: string;
  access_token: string;
  picture: {
    data: {
      url: string;
      is_silhouette?: boolean;
    };
  };
};
