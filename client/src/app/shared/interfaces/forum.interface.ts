export interface User {
  id: number;
  name: string;
  email?: string;
  role: 'user' | 'admin' | 'moderator';
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  authorId: number;
  threadId: string;
  parentId: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  replies: Comment[];
  isLiked?: boolean;
  _count: {
    likes: number;
    replies: number;
  };
}

export interface CurrentUser {
  id: number;
  role: 'user' | 'admin' | 'moderator';
  name: string;
  email?: string;
  profileImage?: string;
}

// Mock current user data for development
export const MOCK_CURRENT_USER: CurrentUser = {
  id: 1,
  role: 'user',
  name: 'Current User',
  email: 'user@example.com',
  profileImage: ''
};

export interface EditCommentData {
  id: string;
  content: string;
}

export interface DeleteCommentResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
  };
}

export interface EditCommentResponse {
  success: boolean;
  message?: string;
  data?: Comment;
}
