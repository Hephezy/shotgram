export type IContextType = {
  user: IUser;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<IUser>>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  checkAuthUser: () => Promise<boolean>;
};

export type INavLink = {
  imgURL: string;
  route: string;
  label: string;
};

export type IUpdateUser = {
  userId: string;
  name: string;
  bio: string;
  imageId: string;
  imageUrl: URL | string;
  file: File[];
};

export type INewPost = {
  userId: string;
  caption: string;
  file: File[];
  location?: string;
  tags?: string;
};

export type IUpdatePost = {
  postId: string;
  caption: string;
  imageId: string;
  imageUrl: URL;
  file: File[];
  location?: string;
  tags?: string;
};

export type IUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  imageUrl: string;
  bio: string;
  save?: {
    post: IPost;
  }[];
  liked?: IPost[];
};

export type INewUser = {
  name: string;
  email: string;
  username: string;
  password: string;
};

export type IPost = {
  id: string;
  created_at: string;
  creator: IUser;
  caption: string;
  imageUrl: string;
  imageId: string;
  location: string;
  tags: string[];
  likes: string[];
  save: {
    id: string;
    userId: string;
  }[];
};

export type IMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
};

export type INotification = {
  id: string;
  created_at: string;
  type: "like" | "comment" | "follow";
  sender: {
    id: string;
    name: string;
    username: string;
    imageUrl: string;
  };
  post_id?: string;
  post?: {
    imageUrl: string;
  };
};

export const INITIAL_USER = {
  id: "",
  name: "",
  username: "",
  email: "",
  imageUrl: "",
  bio: "",
  save: [] as { post: import("@/types").IPost }[],
  liked: [] as import("@/types").IPost[],
};
