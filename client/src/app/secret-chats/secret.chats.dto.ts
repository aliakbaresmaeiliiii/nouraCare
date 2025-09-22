// Client-side DTOs for Secret Chats API with Categories
// Copy these to your frontend/client project

export enum MemberRole {
    ADMIN = 'ADMIN',
    MODERATOR = 'MODERATOR',
    MEMBER = 'MEMBER',
  }
  
  export enum MediaType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    AUDIO = 'AUDIO',
    DOCUMENT = 'DOCUMENT',
  }
  
  export enum MessageType {
    TEXT = 'TEXT',
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    AUDIO = 'AUDIO',
    DOCUMENT = 'DOCUMENT',
    SYSTEM = 'SYSTEM',
  }
  
  // Base User interface
  export interface User {
    id: number;
    name: string | null;
    email: string;
    profileImage: string | null;
  }
  
  // Post Category interface
  export interface PostCategory {
    id: string; // e.g., 'trying-to-conceive'
    name: string; // e.g., 'Trying to conceive'
    description: string;
    color?: string | null; // Hex color for UI
    icon?: string | null; // Emoji or icon name
    order: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
      posts: number;
    };
  }
  
  // Request DTOs (for sending to API)
  export interface CreateSecretChatDto {
    name?: string;
    description?: string;
    isGroup?: boolean;
    memberIds?: number[];
  }
  
  export interface UpdateChatDto {
    name?: string;
    description?: string;
  }
  
  export interface AddMemberDto {
    userId: number;
    role?: MemberRole;
  }
  
  export interface CreatePostMediaDto {
    url: string;
    type: MediaType;
    caption?: string;
    order: number;
    size?: number;
    filename?: string;
  }

  export interface CreatePostMediaNestedDto {
    create: CreatePostMediaDto[];
  }
  
  export interface CreatePostDto {
    content?: string;
    chatId: string;
    categoryId?: string; // NEW: Optional category
    isAnonymous?: boolean;
    media?: CreatePostMediaDto[]; // Direct array as expected by backend
    id?: number;
  }
  
  export interface CreateCommentDto {
    content: string;
    postId: string;
    parentId?: string;
    isAnonymous?: boolean;
  }
  
  export interface CreateMessageDto {
    content?: string;
    chatId: string;
    messageType?: MessageType;
    mediaUrl?: string;
    replyToId?: string;
  }
  
  // Response DTOs (received from API)
  export interface ChatMember {
    id: string;
    userId: number;
    role: MemberRole;
    joinedAt: string;
    leftAt: string | null;
    user: User;
  }
  
  export interface PostMedia {
    id: string;
    url: string;
    type: MediaType;
    caption: string | null;
    order: number;
    createdAt: string;
  }
  
  export interface PostLike {
    id: string;
    userId: number;
    createdAt: string;
  }
  
  export interface CommentLike {
    id: string;
    userId: number;
    createdAt: string;
  }
  
  export interface Comment {
    id: string;
    content: string;
    postId: string;
    authorId: number;
    parentId: string | null;
    isAnonymous: boolean;
    createdAt: string;
    updatedAt: string;
    author: User;
    replies?: Comment[];
    isLiked?: boolean;
    _count: {
      likes: number;
      replies: number;
    };
  }
  
  export interface Post {
    id: string;
    content: string | null;
    chatId: string;
    authorId: number;
    categoryId: string | null; // NEW: Category ID
    isAnonymous: boolean;
    createdAt: string;
    updatedAt: string;
    author: User;
    category?: PostCategory | null; // NEW: Category details
    media: PostMedia[];
    comments?: Comment[];
    isLiked?: boolean;
    _count: {
      comments: number;
      likes: number;
    };
  }
  
  export interface MessageRead {
    id: string;
    userId: number;
    readAt: string;
  }
  
  export interface ChatMessage {
    id: string;
    content: string | null;
    chatId: string;
    senderId: number;
    messageType: MessageType;
    mediaUrl: string | null;
    replyToId: string | null;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    sender: User;
    replyTo?: ChatMessage;
    replies?: ChatMessage[];
    readBy?: MessageRead[];
  }
  
  export interface SecretChat {
    id: string;
    name: string | null;
    description: string | null;
    isGroup: boolean;
    createdById: number;
    createdAt: string;
    updatedAt: string;
    createdBy: User;
    members: ChatMember[];
    posts?: Post[];
    messages?: ChatMessage[];
  }
  
  // API Response wrappers
  export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
  }
  
  export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
  
  // Utility types for common operations
  export interface LikeResponse {
    liked: boolean;
  }
  
  export interface UploadResponse {
    url: string;
    type: MediaType;
  }
  
  export interface SuccessResponse {
    success: boolean;
    message?: string;
  }
  
  // Chat list item (simplified version for chat list)
  export interface ChatListItem {
    id: string;
    name: string | null;
    description: string | null;
    isGroup: boolean;
    updatedAt: string;
    members: ChatMember[];
    lastMessage?: ChatMessage;
    lastPost?: Post;
    unreadCount?: number;
  }
  
  // Extended interfaces for UI components
  export interface PostWithInteractions extends Post {
    isLiked: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }
  
  export interface CommentWithInteractions extends Comment {
    isLiked: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canReply: boolean;
  }
  
  export interface ChatWithPermissions extends SecretChat {
    currentUserRole: MemberRole;
    canAddMembers: boolean;
    canRemoveMembers: boolean;
    canEditChat: boolean;
    canPost: boolean;
  }
  
  // Form interfaces for UI forms
  export interface CreateChatForm {
    name: string;
    description: string;
    isGroup: boolean;
    selectedMembers: number[];
  }
  
  export interface CreatePostForm {
    content: string;
    categoryId?: string; // NEW: Selected category
    isAnonymous: boolean;
    selectedFiles: File[];
    mediaItems: CreatePostMediaDto[];
  }
  
  export interface CreateCommentForm {
    content: string;
    isAnonymous: boolean;
    isReply: boolean;
    parentCommentId?: string;
  }
  
  export interface SendMessageForm {
    content: string;
    messageType: MessageType;
    selectedFile?: File;
    replyToMessage?: ChatMessage;
  }
  
  // Filter and search interfaces
  export interface ChatFilter {
    isGroup?: boolean;
    hasUnreadMessages?: boolean;
    memberCount?: {
      min?: number;
      max?: number;
    };
  }
  
  export interface PostFilter {
    authorId?: number;
    categoryId?: string; // NEW: Filter by category
    isAnonymous?: boolean;
    hasMedia?: boolean;
    mediaType?: MediaType;
    dateRange?: {
      from: string;
      to: string;
    };
  }
  
  // Category-related interfaces
  export interface CategoryStats {
    categoryId: string;
    category: PostCategory;
    postCount: number;
    recentPosts: Post[];
  }
  
  export interface CategoryFilter {
    isActive?: boolean;
    hasMinimumPosts?: number;
  }
  
  // WebSocket event types (if implementing real-time features)
  export interface WebSocketEvent<T = any> {
    type: string;
    payload: T;
    chatId?: string;
    userId?: number;
    timestamp: string;
  }
  
  export interface NewMessageEvent extends WebSocketEvent<ChatMessage> {
    type: 'NEW_MESSAGE';
  }
  
  export interface MessageReadEvent extends WebSocketEvent<{ messageId: string; userId: number }> {
    type: 'MESSAGE_READ';
  }
  
  export interface UserTypingEvent extends WebSocketEvent<{ userId: number; isTyping: boolean }> {
    type: 'USER_TYPING';
  }
  
  export interface NewPostEvent extends WebSocketEvent<Post> {
    type: 'NEW_POST';
  }
  
  export interface PostLikedEvent extends WebSocketEvent<{ postId: string; userId: number; liked: boolean }> {
    type: 'POST_LIKED';
  }
  
  // Error handling
  export interface ApiError {
    message: string;
    statusCode: number;
    error: string;
    timestamp: string;
    path: string;
  }
  
  // Pagination helpers
  export interface PaginationParams {
    page: number;
    limit: number;
  }
  
  export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }
  
  // Pre-defined categories (matching your original array)
  export const DEFAULT_CATEGORIES: PostCategory[] = [
    {
      id: 'trying-to-conceive',
      name: 'Trying to conceive',
      description: 'Questions and support for conception journey',
      color: '#FF6B9D',
      icon: '💕',
      order: 1,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'pregnancy-tests',
      name: 'Pregnancy tests',
      description: 'Testing experiences and questions',
      color: '#4ECDC4',
      icon: '🧪',
      order: 2,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'ovulation',
      name: 'Ovulation',
      description: 'Tracking and understanding ovulation',
      color: '#45B7D1',
      icon: '📅',
      order: 3,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'pregnancy',
      name: 'Pregnancy',
      description: 'General pregnancy discussions',
      color: '#96CEB4',
      icon: '🤱',
      order: 4,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '1st-trimester',
      name: '1st trimester',
      description: 'First trimester experiences and questions',
      color: '#FFEAA7',
      icon: '🌱',
      order: 5,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '2nd-trimester',
      name: '2nd trimester',
      description: 'Second trimester discussions',
      color: '#FD79A8',
      icon: '🌸',
      order: 6,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '3rd-trimester',
      name: '3rd trimester',
      description: 'Third trimester experiences',
      color: '#E17055',
      icon: '🌺',
      order: 7,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'parenthood',
      name: 'Parenthood',
      description: 'Life with your little one',
      color: '#A29BFE',
      icon: '👶',
      order: 8,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'postpartum',
      name: 'Postpartum',
      description: 'Recovery and postpartum life',
      color: '#FD79A8',
      icon: '🌼',
      order: 9,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'relationships',
      name: 'Relationships',
      description: 'Partner and family relationships',
      color: '#FDCB6E',
      icon: '💑',
      order: 10,
      isActive: true,
      createdAt: '',
      updatedAt: '',
    },
  ];
  