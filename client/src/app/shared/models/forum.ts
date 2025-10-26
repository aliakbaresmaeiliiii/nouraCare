export interface ThreadDetailResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    content: string;
    author: {
      id: number;
      name: string;
      profileImage: string | null;
    };
    forum: {
      id: string;
      title: string;
      description: string;
      categoryId: string;
    };
    isLocked: boolean;
    isPinned: boolean;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    posts: Array<{
      id: string;
      content: string;
      author: {
        id: number;
        name: string;
        profileImage: string | null;
      };
      authorId: number;
      threadId: string;
      parentId: string | null;
      isDeleted: boolean;
      createdAt: string;
      updatedAt: string;
      replies: any[];
      _count: {
        likes: number;
        replies: number;
      };
    }>;
    _count: {
      posts: number;
    };
  };
}

export interface LikeCommentDto {
  isLike: boolean;
}

export interface CreateCommentDto {
  content: string;
  postId?: string;
  parentId?: string | null;
  forumId?: string;
}

export interface CreateForumPostDto {
  title: string;
  content: string;
  categoryId: string;
  tags?: string[];
  authorId: number;
}

export interface CreateForumThreadDto {
  title: string;
  content: string;
  forumId: string;
  authorId: number;
}

export interface PostResponse {
  success: boolean;
  data: {
    id: string;
    content: string;
    author: {
      id: number;
      name: string;
      profileImage: string | null;
    };
    authorId: number;
    threadId: string;
    parentId: string | null;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
      likes: number;
      replies: number;
    };
  };
}

export interface LikeResponse {
  success: boolean;
  data: {
    liked: boolean;
  };
}

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  topicsCount: number;
  postsCount: number;
  lastActivity: string;
  isPopular: boolean;
}

export interface ForumTopic {
  id: string;
  title: string;
  description: string;
  author: string;
  authorAvatar?: string;
  category: string;
  categoryId?: string;
  replies: number;
  views: number;
  lastReply: string;
  isPinned: boolean;
  isLocked: boolean;
  likeCount?: number;
  forumPosts: forumPosts[];
  tags: string[];
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profileImage: string;
  };
  createdAt: string;
  forumId: string;
  posts?: Comment[];
}
export interface ThreadsResponse {
  success: boolean;
  data: ForumTopic[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

interface forumPosts {
  authorId: number;
  content: string;
  createdAt: string;
  id: string;
  isDeleted: boolean;
  parentId: string;
  threadId: string;
  updatedAt: string;
}
export interface Comment {
  id: string;
  content: string;
  author: {
    id: number;
    name: string;
    profileImage: string | null;
  };
  authorId: number;
  threadId: string;
  parentId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  replies: Comment[];
  isLiked?: boolean;
  likeCount?: number;
  _count: {
    likes: number;
    replies: number;
  };
}
