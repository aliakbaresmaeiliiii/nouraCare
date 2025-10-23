import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import {
  CreateSecretChatDto,
  CreatePostDto,
  CreateCommentDto,
  CreateMessageDto,
  UpdateChatDto,
  AddMemberDto,
  MemberRole,
} from './dto';

@Injectable()
export class SecretChatsService {
  constructor(private prismaService: PrismaService) {}

  // // Category Management
  // async getAllCategories() {
  //   return this.prismaService.postCategory.findMany({
  //     where: { isActive: true },
  //     orderBy: { order: 'asc' },
  //   });
  // }

  // async getCategoryById(categoryId: string) {
  //   const category = await this.prismaService.postCategory.findUnique({
  //     where: { id: categoryId },
  //     include: {
  //       _count: {
  //         select: { posts: true },
  //       },
  //     },
  //   });

  //   if (!category) {
  //     throw new NotFoundException('Category not found');
  //   }

  //   return category;
  // }

  // // Chat Management
  // async createChat(userId: number, createChatDto: CreateSecretChatDto) {
  //   const chat = await this.prismaService.secretChat.create({
  //     data: {
  //       name: createChatDto.name,
  //       description: createChatDto.description,
  //       isGroup: createChatDto.isGroup || false,
  //       createdById: userId,
  //       members: {
  //         create: [
  //           {
  //             userId: userId,
  //             role: MemberRole.ADMIN,
  //           },
  //           ...(createChatDto.memberIds || []).map((memberId) => ({
  //             userId: memberId,
  //             role: MemberRole.MEMBER,
  //           })),
  //         ],
  //       },
  //     },
  //     include: {
  //       members: {
  //         include: {
  //           user: {
  //             select: {
  //               id: true,
  //               name: true,
  //               email: true,
  //               profileImage: true,
  //             },
  //           },
  //         },
  //       },
  //       createdBy: {
  //         select: {
  //           id: true,
  //           name: true,
  //           email: true,
  //           profileImage: true,
  //         },
  //       },
  //     },
  //   });

  //   return chat;
  // }

  // async getUserChats(userId: number) {
  //   const chats = await this.prismaService.secretChat.findMany({
  //     where: {
  //       members: {
  //         some: {
  //           userId: userId,
  //           leftAt: null,
  //         },
  //       },
  //     },
  //     include: {
  //       members: {
  //         where: { leftAt: null },
  //         include: {
  //           user: {
  //             select: {
  //               id: true,
  //               name: true,
  //               email: true,
  //               profileImage: true,
  //             },
  //           },
  //         },
  //       },
  //       posts: {
  //         take: 1,
  //         orderBy: { createdAt: 'desc' },
  //         include: {
  //           author: {
  //             select: {
  //               id: true,
  //               name: true,
  //               profileImage: true,
  //             },
  //           },
  //           category: {
  //             select: {
  //               id: true,
  //               name: true,
  //               color: true,
  //               icon: true,
  //             },
  //           },
  //           media: {
  //             take: 1,
  //             orderBy: { order: 'asc' },
  //           },
  //           _count: {
  //             select: {
  //               comments: true,
  //               likes: true,
  //             },
  //           },
  //         },
  //       },
  //       messages: {
  //         take: 1,
  //         orderBy: { createdAt: 'desc' },
  //         include: {
  //           sender: {
  //             select: {
  //               id: true,
  //               name: true,
  //               profileImage: true,
  //             },
  //           },
  //         },
  //       },
  //       _count: {
  //         select: {
  //           members: {
  //             where: { leftAt: null },
  //           },
  //           posts: true,
  //           messages: true,
  //         },
  //       },
  //     },
  //     orderBy: { updatedAt: 'desc' },
  //   });

  //   // Format the response for better client consumption
  //   return chats.map((chat) => {
  //     const currentUserMember = chat.members.find(
  //       (member) => member.userId === userId,
  //     );
  //     const lastActivity = chat.posts[0] || chat.messages[0];

  //     return {
  //       id: chat.id,
  //       name: chat.name,
  //       description: chat.description,
  //       isGroup: chat.isGroup,
  //       createdAt: chat.createdAt,
  //       updatedAt: chat.updatedAt,
  //       memberCount: chat._count.members,
  //       postCount: chat._count.posts,
  //       messageCount: chat._count.messages,
  //       currentUserRole: currentUserMember?.role || 'MEMBER',
  //       members: chat.members.map((member) => ({
  //         id: member.id,
  //         userId: member.userId,
  //         role: member.role,
  //         joinedAt: member.joinedAt,
  //         user: member.user,
  //       })),
  //       lastPost: chat.posts[0] || null,
  //       lastMessage: chat.messages[0] || null,
  //       lastActivity: lastActivity
  //         ? {
  //             type: chat.posts[0] ? 'post' : 'message',
  //             createdAt: lastActivity.createdAt,
  //             preview: chat.posts[0]
  //               ? chat.posts[0].content?.substring(0, 100) +
  //                 (chat.posts[0].content?.length > 100 ? '...' : '')
  //               : chat.messages[0]?.content?.substring(0, 100) +
  //                 (chat.messages[0]?.content?.length > 100 ? '...' : ''),
  //           }
  //         : null,
  //     };
  //   });
  // }

  // async getChatById(chatId: string, userId: number) {
  //   // Check if user is a member of the chat
  //   const membership = await this.prismaService.chatMember.findUnique({
  //     where: {
  //       chatId_userId: {
  //         chatId: chatId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (!membership || membership.leftAt) {
  //     throw new ForbiddenException('You are not a member of this chat');
  //   }

  //   const chat = await this.prismaService.secretChat.findUnique({
  //     where: { id: chatId },
  //     include: {
  //       members: {
  //         where: { leftAt: null },
  //         include: {
  //           user: {
  //             select: {
  //               id: true,
  //               name: true,
  //               email: true,
  //               profileImage: true,
  //             },
  //           },
  //         },
  //       },
  //       createdBy: {
  //         select: {
  //           id: true,
  //           name: true,
  //           email: true,
  //           profileImage: true,
  //         },
  //       },
  //     },
  //   });

  //   if (!chat) {
  //     throw new NotFoundException('Chat not found');
  //   }

  //   return chat;
  // }

  // async updateChat(
  //   chatId: string,
  //   userId: number,
  //   updateChatDto: UpdateChatDto,
  // ) {
  //   // Check if user has permission to update chat
  //   const membership = await this.prismaService.chatMember.findUnique({
  //     where: {
  //       chatId_userId: {
  //         chatId: chatId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (
  //     !membership ||
  //     membership.leftAt ||
  //     membership.role === MemberRole.MEMBER
  //   ) {
  //     throw new ForbiddenException(
  //       'You do not have permission to update this chat',
  //     );
  //   }

  //   const updatedChat = await this.prismaService.secretChat.update({
  //     where: { id: chatId },
  //     data: {
  //       name: updateChatDto.name,
  //       description: updateChatDto.description,
  //       updatedAt: new Date(),
  //     },
  //     include: {
  //       members: {
  //         where: { leftAt: null },
  //         include: {
  //           user: {
  //             select: {
  //               id: true,
  //               name: true,
  //               email: true,
  //               profileImage: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   return updatedChat;
  // }

  // async addMember(chatId: string, userId: number, addMemberDto: AddMemberDto) {
  //   // Check if user has permission to add members
  //   const membership = await this.prismaService.chatMember.findUnique({
  //     where: {
  //       chatId_userId: {
  //         chatId: chatId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (
  //     !membership ||
  //     membership.leftAt ||
  //     membership.role === MemberRole.MEMBER
  //   ) {
  //     throw new ForbiddenException('You do not have permission to add members');
  //   }

  //   // Check if the user is already a member
  //   const existingMember = await this.prismaService.chatMember.findUnique({
  //     where: {
  //       chatId_userId: {
  //         chatId: chatId,
  //         userId: addMemberDto.userId,
  //       },
  //     },
  //   });

  //   if (existingMember && !existingMember.leftAt) {
  //     throw new BadRequestException('User is already a member of this chat');
  //   }

  //   if (existingMember && existingMember.leftAt) {
  //     // Re-add the user
  //     return this.prismaService.chatMember.update({
  //       where: { id: existingMember.id },
  //       data: {
  //         role: addMemberDto.role || MemberRole.MEMBER,
  //         leftAt: null,
  //         joinedAt: new Date(),
  //       },
  //       include: {
  //         user: {
  //           select: {
  //             id: true,
  //             name: true,
  //             email: true,
  //             profileImage: true,
  //           },
  //         },
  //       },
  //     });
  //   }

  //   // Add new member
  //   return this.prismaService.chatMember.create({
  //     data: {
  //       chatId: chatId,
  //       userId: addMemberDto.userId,
  //       role: addMemberDto.role || MemberRole.MEMBER,
  //     },
  //     include: {
  //       user: {
  //         select: {
  //           id: true,
  //           name: true,
  //           email: true,
  //           profileImage: true,
  //         },
  //       },
  //     },
  //   });
  // }

  // async removeMember(chatId: string, userId: number, memberUserId: number) {
  //   // Check if user has permission to remove members
  //   const membership = await this.prismaService.chatMember.findUnique({
  //     where: {
  //       chatId_userId: {
  //         chatId: chatId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (
  //     !membership ||
  //     membership.leftAt ||
  //     membership.role === MemberRole.MEMBER
  //   ) {
  //     throw new ForbiddenException(
  //       'You do not have permission to remove members',
  //     );
  //   }

  //   const memberToRemove = await this.prismaService.chatMember.findUnique({
  //     where: {
  //       chatId_userId: {
  //         chatId: chatId,
  //         userId: memberUserId,
  //       },
  //     },
  //   });

  //   if (!memberToRemove || memberToRemove.leftAt) {
  //     throw new NotFoundException('Member not found in this chat');
  //   }

  //   return this.prismaService.chatMember.update({
  //     where: { id: memberToRemove.id },
  //     data: { leftAt: new Date() },
  //   });
  // }

  // async leaveChat(chatId: string, userId: number) {
  //   const membership = await this.prismaService.chatMember.findUnique({
  //     where: {
  //       chatId_userId: {
  //         chatId: chatId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (!membership || membership.leftAt) {
  //     throw new NotFoundException('You are not a member of this chat');
  //   }

  //   return this.prismaService.chatMember.update({
  //     where: { id: membership.id },
  //     data: { leftAt: new Date() },
  //   });
  // }

  // // Post Management
  // async createPost(userId: number, createPostDto: CreatePostDto) {
  //   // Check if user is a member of the chat
  //   const membership = await this.prismaService.chatMember.findUnique({
  //     where: {
  //       chatId_userId: {
  //         chatId: createPostDto.chatId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (!membership || membership.leftAt) {
  //     throw new ForbiddenException('You are not a member of this chat');
  //   }

  //   const post = await this.prismaService.post.create({
  //     data: {
  //       content: createPostDto.content,
  //       chatId: createPostDto.chatId,
  //       authorId: userId,
  //       categoryId: createPostDto.categoryId,
  //       isAnonymous: createPostDto.isAnonymous || false,
  //       media: createPostDto.media && createPostDto.media.length > 0
  //         ? {
  //             create: createPostDto.media.map((media, index) => ({
  //               url: media.url,
  //               type: media.type,
  //               caption: media.caption,
  //               order: index,
  //             })),
  //           }
  //         : undefined,
  //     },
  //     include: {
  //       author: {
  //         select: {
  //           id: true,
  //           name: true,
  //           profileImage: true,
  //         },
  //       },
  //       category: {
  //         select: {
  //           id: true,
  //           name: true,
  //           color: true,
  //           icon: true,
  //         },
  //       },
  //       media: {
  //         orderBy: { order: 'asc' },
  //       },
  //       _count: {
  //         select: {
  //           comments: true,
  //           likes: true,
  //         },
  //       },
  //     },
  //   });

  //   return post;
  // }

  // async getChatPosts(
  //   chatId: string,
  //   userId: number,
  //   page: number = 1,
  //   limit: number = 20,
  //   categoryId?: string,
  // ) {
  //   // Check if user is a member of the chat
  //   const membership = await this.prismaService.chatMember.findUnique({
  //     where: {
  //       chatId_userId: {
  //         chatId: chatId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (!membership || membership.leftAt) {
  //     throw new ForbiddenException('You are not a member of this chat');
  //   }

  //   const where: any = { chatId: chatId };
  //   if (categoryId) {
  //     where.categoryId = categoryId;
  //   }

  //   const posts = await this.prismaService.post.findMany({
  //     where,
  //     include: {
  //       author: {
  //         select: {
  //           id: true,
  //           name: true,
  //           profileImage: true,
  //         },
  //       },
  //       category: {
  //         select: {
  //           id: true,
  //           name: true,
  //           color: true,
  //           icon: true,
  //         },
  //       },
  //       media: {
  //         orderBy: { order: 'asc' },
  //       },
  //       comments: {
  //         take: 3,
  //         orderBy: { createdAt: 'desc' },
  //         include: {
  //           author: {
  //             select: {
  //               id: true,
  //               name: true,
  //               profileImage: true,
  //             },
  //           },
  //         },
  //       },
  //       _count: {
  //         select: {
  //           comments: true,
  //           likes: true,
  //         },
  //       },
  //     },
  //     orderBy: { createdAt: 'desc' },
  //     skip: (page - 1) * limit,
  //     take: limit,
  //   });

  //   return posts.map((post) => ({
  //     ...post,
  //     isLiked: false, // We removed the likes array, so we can't check if user liked it
  //   }));
  // }

  // async getChatPostsCount(chatId: string, categoryId?: string) {
  //   const where: any = { chatId: chatId };
  //   if (categoryId) {
  //     where.categoryId = categoryId;
  //   }

  //   return this.prismaService.post.count({
  //     where,
  //   });
  // }

  // async likePost(postId: string, userId: number) {
  //   const post = await this.prismaService.post.findUnique({
  //     where: { id: postId },
  //     include: { chat: true },
  //   });

  //   if (!post) {
  //     throw new NotFoundException('Post not found');
  //   }

  //   // Check if user is a member of the chat
  //   const membership = await this.prismaService.chatMember.findUnique({
  //     where: {
  //       chatId_userId: {
  //         chatId: post.chatId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (!membership || membership.leftAt) {
  //     throw new ForbiddenException('You are not a member of this chat');
  //   }

  //   // Check if already liked
  //   const existingLike = await this.prismaService.postLike.findUnique({
  //     where: {
  //       postId_userId: {
  //         postId: postId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (existingLike) {
  //     // Unlike
  //     await this.prismaService.postLike.delete({
  //       where: { id: existingLike.id },
  //     });
  //     return { liked: false };
  //   } else {
  //     // Like
  //     await this.prismaService.postLike.create({
  //       data: {
  //         postId: postId,
  //         userId: userId,
  //       },
  //     });
  //     return { liked: true };
  //   }
  // }

  // // Comment Management
  // async createComment(userId: number, createCommentDto: CreateCommentDto) {
  //   const post = await this.prismaService.post.findUnique({
  //     where: { id: createCommentDto.postId },
  //     include: { chat: true },
  //   });

  //   if (!post) {
  //     throw new NotFoundException('Post not found');
  //   }

  //   // Check if user is a member of the chat
  //   const membership = await this.prismaService.chatMember.findUnique({
  //     where: {
  //       chatId_userId: {
  //         chatId: post.chatId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (!membership || membership.leftAt) {
  //     throw new ForbiddenException('You are not a member of this chat');
  //   }

  //   const comment = await this.prismaService.comment.create({
  //     data: {
  //       content: createCommentDto.content,
  //       postId: createCommentDto.postId,
  //       authorId: userId,
  //       parentId: createCommentDto.parentId,
  //       isAnonymous: createCommentDto.isAnonymous || false,
  //     },
  //     include: {
  //       author: {
  //         select: {
  //           id: true,
  //           name: true,
  //           profileImage: true,
  //         },
  //       },
  //       replies: {
  //         include: {
  //           author: {
  //             select: {
  //               id: true,
  //               name: true,
  //               profileImage: true,
  //             },
  //           },
  //         },
  //       },
  //       _count: {
  //         select: {
  //           likes: true,
  //         },
  //       },
  //     },
  //   });

  //   return comment;
  // }

  // async getPostComments(
  //   postId: string,
  //   userId: number,
  //   page: number = 1,
  //   limit: number = 20,
  // ) {
  //   const post = await this.prismaService.post.findUnique({
  //     where: { id: postId },
  //     include: { chat: true },
  //   });

  //   if (!post) {
  //     throw new NotFoundException('Post not found');
  //   }

  //   // Check if user is a member of the chat
  //   const membership = await this.prismaService.chatMember.findUnique({
  //     where: {
  //       chatId_userId: {
  //         chatId: post.chatId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (!membership || membership.leftAt) {
  //     throw new ForbiddenException('You are not a member of this chat');
  //   }

  //   const comments = await this.prismaService.comment.findMany({
  //     where: {
  //       postId: postId,
  //       parentId: null, // Only top-level comments
  //     },
  //     include: {
  //       author: {
  //         select: {
  //           id: true,
  //           name: true,
  //           profileImage: true,
  //         },
  //       },
  //       replies: {
  //         take: 3,
  //         orderBy: { createdAt: 'asc' },
  //         include: {
  //           author: {
  //             select: {
  //               id: true,
  //               name: true,
  //               profileImage: true,
  //             },
  //           },
  //           _count: {
  //             select: {
  //               likes: true,
  //             },
  //           },
  //         },
  //       },
  //       likes: {
  //         where: { userId: userId },
  //         select: { id: true },
  //       },
  //       _count: {
  //         select: {
  //           likes: true,
  //           replies: true,
  //         },
  //       },
  //     },
  //     orderBy: { createdAt: 'desc' },
  //     skip: (page - 1) * limit,
  //     take: limit,
  //   });

  //   return comments.map((comment) => ({
  //     ...comment,
  //     isLiked: comment.likes.length > 0,
  //     likes: undefined, // Remove the likes array, we only needed it for checking
  //   }));
  // }

  // async likeComment(commentId: string, userId: number) {
  //   const comment = await this.prismaService.comment.findUnique({
  //     where: { id: commentId },
  //     include: {
  //       post: {
  //         include: { chat: true },
  //       },
  //     },
  //   });

  //   if (!comment) {
  //     throw new NotFoundException('Comment not found');
  //   }

  //   // Check if user is a member of the chat
  //   const membership = await this.prismaService.chatMember.findUnique({
  //     where: {
  //       chatId_userId: {
  //         chatId: comment.post.chatId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (!membership || membership.leftAt) {
  //     throw new ForbiddenException('You are not a member of this chat');
  //   }

  //   // Check if already liked
  //   const existingLike = await this.prismaService.commentLike.findUnique({
  //     where: {
  //       commentId_userId: {
  //         commentId: commentId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (existingLike) {
  //     // Unlike
  //     await this.prismaService.commentLike.delete({
  //       where: { id: existingLike.id },
  //     });
  //     return { liked: false };
  //   } else {
  //     // Like
  //     await this.prismaService.commentLike.create({
  //       data: {
  //         commentId: commentId,
  //         userId: userId,
  //       },
  //     });
  //     return { liked: true };
  //   }
  // }

  // // Message Management
  // async createMessage(userId: number, createMessageDto: CreateMessageDto) {
  //   // Check if user is a member of the chat
  //   const membership = await this.prismaService.chatMember.findUnique({
  //     where: {
  //       chatId_userId: {
  //         chatId: createMessageDto.chatId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (!membership || membership.leftAt) {
  //     throw new ForbiddenException('You are not a member of this chat');
  //   }

  //   const message = await this.prismaService.chatMessage.create({
  //     data: {
  //       content: createMessageDto.content,
  //       chatId: createMessageDto.chatId,
  //       senderId: userId,
  //       messageType: createMessageDto.messageType,
  //       mediaUrl: createMessageDto.mediaUrl,
  //       replyToId: createMessageDto.replyToId,
  //     },
  //     include: {
  //       sender: {
  //         select: {
  //           id: true,
  //           name: true,
  //           profileImage: true,
  //         },
  //       },
  //       replyTo: {
  //         include: {
  //           sender: {
  //             select: {
  //               id: true,
  //               name: true,
  //               profileImage: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   // Update chat's updatedAt
  //   await this.prismaService.secretChat.update({
  //     where: { id: createMessageDto.chatId },
  //     data: { updatedAt: new Date() },
  //   });

  //   return message;
  // }

  // async getChatMessages(
  //   chatId: string,
  //   userId: number,
  //   page: number = 1,
  //   limit: number = 50,
  // ) {
  //   // Check if user is a member of the chat
  //   const membership = await this.prismaService.chatMember.findUnique({
  //     where: {
  //       chatId_userId: {
  //         chatId: chatId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (!membership || membership.leftAt) {
  //     throw new ForbiddenException('You are not a member of this chat');
  //   }

  //   const messages = await this.prismaService.chatMessage.findMany({
  //     where: {
  //       chatId: chatId,
  //       isDeleted: false,
  //     },
  //     include: {
  //       sender: {
  //         select: {
  //           id: true,
  //           name: true,
  //           profileImage: true,
  //         },
  //       },
  //       replyTo: {
  //         include: {
  //           sender: {
  //             select: {
  //               id: true,
  //               name: true,
  //               profileImage: true,
  //             },
  //           },
  //         },
  //       },
  //       readBy: {
  //         where: { userId: userId },
  //         select: { id: true, readAt: true },
  //       },
  //     },
  //     orderBy: { createdAt: 'desc' },
  //     skip: (page - 1) * limit,
  //     take: limit,
  //   });

  //   return messages.reverse(); // Return in ascending order for chat display
  // }

  // async markMessageAsRead(messageId: string, userId: number) {
  //   const message = await this.prismaService.chatMessage.findUnique({
  //     where: { id: messageId },
  //     include: { chat: true },
  //   });

  //   if (!message) {
  //     throw new NotFoundException('Message not found');
  //   }

  //   // Check if user is a member of the chat
  //   const membership = await this.prismaService.chatMember.findUnique({
  //     where: {
  //       chatId_userId: {
  //         chatId: message.chatId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (!membership || membership.leftAt) {
  //     throw new ForbiddenException('You are not a member of this chat');
  //   }

  //   // Check if already read
  //   const existingRead = await this.prismaService.messageRead.findUnique({
  //     where: {
  //       messageId_userId: {
  //         messageId: messageId,
  //         userId: userId,
  //       },
  //     },
  //   });

  //   if (!existingRead) {
  //     await this.prismaService.messageRead.create({
  //       data: {
  //         messageId: messageId,
  //         userId: userId,
  //       },
  //     });
  //   }

  //   return { success: true };
  // }
}
