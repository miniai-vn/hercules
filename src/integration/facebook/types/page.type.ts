export interface IPageInfo {
  id: string;
  name: string;
  access_token: string;
  picture: {
    data: {
      url: string;
      is_silhouette?: boolean;
    };
  };
}

