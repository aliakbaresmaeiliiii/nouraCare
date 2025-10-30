import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { SecretChatsService } from './secret-chats.service';
import {
  CreateSecretChatDto,
  CreatePostDto,
  CreateCommentDto,
  CreateMessageDto,
  UpdateChatDto,
  AddMemberDto,
} from './dto';

// Note: You'll need to implement authentication guards
// For now, I'm assuming you have a way to get userId from the request
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
  };
}

@Controller('secret-chats')
export class SecretChatsController {
  constructor(private secretChatsService: SecretChatsService) {}

  // // Category Management Endpoints
  // @Get('categories')
  // async getAllCategories() {
  //   const categories = await this.secretChatsService.getAllCategories();
  //   return {
  //     data: categories,
  //     success: true,
  //     message: 'Categories retrieved successfully',
  //   };
  // }

  // @Get('categories/:categoryId')
  // async getCategoryById(@Param('categoryId') categoryId: string) {
  //   return this.secretChatsService.getCategoryById(categoryId);
  // }

  // // Chat Management Endpoints
  // @Post()
  // createChat(
  //   @Request() req: AuthenticatedRequest,
  //   @Body() createChatDto: CreateSecretChatDto,
  // ) {
  //   return this.secretChatsService.createChat(req.user.id, createChatDto);
  // }

  // @Get()
  // async getUserChats(@Request() req: AuthenticatedRequest) {
  //   const userId = req.user?.id || 1; // Temporary fallback
  //   const chats = await this.secretChatsService.getUserChats(userId);
  //   return {
  //     data: chats,
  //     success: true,
  //     message: 'Chats retrieved successfully',
  //   };
  // }

  // @Get('user/:userId/chats')
  // async getChats(@Param('userId') userId: number) {
  //   const chats = await this.secretChatsService.getUserChats(+userId);
  //   return {
  //     data: chats,
  //     success: true,
  //     message: 'Chats retrieved successfully',
  //   };
  // }

  // @Get(':chatId')
  // async getChatById(
  //   @Param('chatId') chatId: string,
  //   @Request() req: AuthenticatedRequest,
  // ) {
  //   return this.secretChatsService.getChatById(chatId, req.user.id);
  // }

  // @Put(':chatId')
  // async updateChat(
  //   @Param('chatId') chatId: string,
  //   @Request() req: AuthenticatedRequest,
  //   @Body() updateChatDto: UpdateChatDto,
  // ) {
  //   return this.secretChatsService.updateChat(
  //     chatId,
  //     req.user.id,
  //     updateChatDto,
  //   );
  // }

  // @Post(':chatId/members')
  // async addMember(
  //   @Param('chatId') chatId: string,
  //   @Request() req: AuthenticatedRequest,
  //   @Body() addMemberDto: AddMemberDto,
  // ) {
  //   return this.secretChatsService.addMember(chatId, req.user.id, addMemberDto);
  // }

  // @Delete(':chatId/members/:userId')
  // async removeMember(
  //   @Param('chatId') chatId: string,
  //   @Param('userId') memberuserId: number,
  //   @Request() req: AuthenticatedRequest,
  // ) {
  //   return this.secretChatsService.removeMember(
  //     chatId,
  //     req.user.id,
  //     +memberUserId,
  //   );
  // }

  // @Post(':chatId/leave')
  // async leaveChat(
  //   @Param('chatId') chatId: string,
  //   @Request() req: AuthenticatedRequest,
  // ) {
  //   return this.secretChatsService.leaveChat(chatId, req.user.id);
  // }

  // // Post Management Endpoints
  // @Post('posts')
  // async createPost(
  //   @Request() req: AuthenticatedRequest,
  //   @Body() createPostDto: CreatePostDto,
  // ) {
  //   // Temporary fix: use a default user ID for testing
  //   const userId = req.user?.id || 1; // Replace with actual auth when implemented
  //   return this.secretChatsService.createPost(userId, createPostDto);
  // }

  // @Post('posts/upload')
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: diskStorage({
  //       destination: (_req, _file, cb) => {
  //         const dir = join(
  //           process.cwd(),
  //           'server',
  //           'public',
  //           'uploads',
  //           'posts',
  //         );
  //         if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  //         cb(null, dir);
  //       },
  //       filename: (_req, file, cb) => {
  //         const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
  //         cb(null, unique + extname(file.originalname));
  //       },
  //     }),
  //     limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  //     fileFilter: (_req, file, cb) => {
  //       const allowedTypes = ['image/', 'video/', 'audio/'];
  //       const isAllowed = allowedTypes.some((type) =>
  //         file.mimetype.startsWith(type),
  //       );
  //       if (!isAllowed) {
  //         return cb(
  //           new BadRequestException(
  //             'Only image, video, and audio files are allowed',
  //           ),
  //           false,
  //         );
  //       }
  //       cb(null, true);
  //     },
  //   }),
  // )
  // async uploadPostMedia(@UploadedFile() file: any) {
  //   if (!file) throw new BadRequestException('No file uploaded');
  //   const baseUrl = process.env.BASE_URL || 'http://172.20.10.2:8080';
  //   const url = `${baseUrl}/uploads/posts/${file.filename}`;

  //   let type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' = 'DOCUMENT';
  //   if (file.mimetype.startsWith('image/')) type = 'IMAGE';
  //   else if (file.mimetype.startsWith('video/')) type = 'VIDEO';
  //   else if (file.mimetype.startsWith('audio/')) type = 'AUDIO';

  //   return { url, type };
  // }

  // @Get(':chatId/posts')
  // async getChatPosts(
  //   @Param('chatId') chatId: string,
  //   @Request() req: AuthenticatedRequest,
  //   @Query('page') page: string = '1',
  //   @Query('limit') limit: string = '20',
  //   @Query('categoryId') categoryId?: string,
  // ) {
  //   const userId = req.user?.id || 1; // Temporary fallback
  //   const pageNum = parseInt(page);
  //   const limitNum = parseInt(limit);

  //   const posts = await this.secretChatsService.getChatPosts(
  //     chatId,
  //     userId,
  //     pageNum,
  //     limitNum,
  //     categoryId,
  //   );

  //   // Get total count for pagination
  //   const totalCount = await this.secretChatsService.getChatPostsCount(
  //     chatId,
  //     categoryId,
  //   );
  //   const totalPages = Math.ceil(totalCount / limitNum);

  //   return {
  //     data: posts,
  //     total: totalCount,
  //     page: pageNum,
  //     limit: limitNum,
  //     totalPages: totalPages,
  //     success: true,
  //     message: 'Posts retrieved successfully',
  //   };
  // }

  // @Post('posts/:postId/like')
  // async likePost(
  //   @Param('postId') postId: string,
  //   @Request() req: AuthenticatedRequest,
  // ) {
  //   return this.secretChatsService.likePost(postId, req.user.id);
  // }

  // // Comment Management Endpoints
  // @Post('comments')
  // async createComment(
  //   @Request() req: AuthenticatedRequest,
  //   @Body() createCommentDto: CreateCommentDto,
  // ) {
  //   return this.secretChatsService.createComment(req.user.id, createCommentDto);
  // }

  // @Get('posts/:postId/comments')
  // async getPostComments(
  //   @Param('postId') postId: string,
  //   @Request() req: AuthenticatedRequest,
  //   @Query('page') page: string = '1',
  //   @Query('limit') limit: string = '20',
  // ) {
  //   return this.secretChatsService.getPostComments(
  //     postId,
  //     req.user.id,
  //     parseInt(page),
  //     parseInt(limit),
  //   );
  // }

  // @Post('comments/:commentId/like')
  // async likeComment(
  //   @Param('commentId') commentId: string,
  //   @Request() req: AuthenticatedRequest,
  // ) {
  //   return this.secretChatsService.likeComment(commentId, req.user.id);
  // }

  // // Message Management Endpoints
  // @Post('messages')
  // async createMessage(
  //   @Request() req: AuthenticatedRequest,
  //   @Body() createMessageDto: CreateMessageDto,
  // ) {
  //   return this.secretChatsService.createMessage(req.user.id, createMessageDto);
  // }

  // @Post('messages/upload')
  // @UseInterceptors(
  //   FileInterceptor('file', {
  //     storage: diskStorage({
  //       destination: (_req, _file, cb) => {
  //         const dir = join(
  //           process.cwd(),
  //           'server',
  //           'public',
  //           'uploads',
  //           'messages',
  //         );
  //         if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  //         cb(null, dir);
  //       },
  //       filename: (_req, file, cb) => {
  //         const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
  //         cb(null, unique + extname(file.originalname));
  //       },
  //     }),
  //     limits: { fileSize: 25 * 1024 * 1024 }, // 25MB for messages
  //     fileFilter: (_req, file, cb) => {
  //       cb(null, true); // Allow all file types for messages
  //     },
  //   }),
  // )
  // async uploadMessageMedia(@UploadedFile() file: any) {
  //   if (!file) throw new BadRequestException('No file uploaded');
  //   const baseUrl = process.env.BASE_URL || 'http://172.20.10.2:8080';
  //   const url = `${baseUrl}/uploads/messages/${file.filename}`;

  //   let type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' = 'DOCUMENT';
  //   if (file.mimetype.startsWith('image/')) type = 'IMAGE';
  //   else if (file.mimetype.startsWith('video/')) type = 'VIDEO';
  //   else if (file.mimetype.startsWith('audio/')) type = 'AUDIO';

  //   return { url, type };
  // }

  // @Get(':chatId/messages')
  // async getChatMessages(
  //   @Param('chatId') chatId: string,
  //   @Request() req: AuthenticatedRequest,
  //   @Query('page') page: string = '1',
  //   @Query('limit') limit: string = '50',
  // ) {
  //   return this.secretChatsService.getChatMessages(
  //     chatId,
  //     req.user.id,
  //     parseInt(page),
  //     parseInt(limit),
  //   );
  // }

  // @Post('messages/:messageId/read')
  // async markMessageAsRead(
  //   @Param('messageId') messageId: string,
  //   @Request() req: AuthenticatedRequest,
  // ) {
  //   return this.secretChatsService.markMessageAsRead(messageId, req.user.id);
  // }

  // // Utility endpoints for development/testing
  // @Get('test/user/:userId')
  // async testGetUserChats(@Param('userId') userId: number) {
  //   // This is a test endpoint - remove in production
  //   return this.secretChatsService.getUserChats(+userId);
  // }

  // @Post('test/chat/:chatId/user/:userId')
  // async testCreatePost(
  //   @Param('chatId') chatId: string,
  //   @Param('userId') userId: number,
  //   @Body() createPostDto: Omit<CreatePostDto, 'chatId'>,
  // ) {
  //   // This is a test endpoint - remove in production
  //   return this.secretChatsService.createPost(+userId, {
  //     ...createPostDto,
  //     chatId,
  //   });
  // }
}
