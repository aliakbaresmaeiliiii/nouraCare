import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    // For now, using a hardcoded user ID. In production, this should come from JWT token
    const userId = 1; // Replace with actual user ID from authentication
    return this.postsService.create(userId, createPostDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('categoryId') categoryId?: string,
  ) {
    return this.postsService.findAll(
      parseInt(page),
      parseInt(limit),
      categoryId,
    );
  }

  @Get('popular-tags')
  getPopularTags() {
    return this.postsService.getPopularTags();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    // For now, using a hardcoded user ID. In production, this should come from JWT token
    const userId = 1; // Replace with actual user ID from authentication
    return this.postsService.update(id, userId, updatePostDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // For now, using a hardcoded user ID. In production, this should come from JWT token
    const userId = 1; // Replace with actual user ID from authentication
    return this.postsService.remove(id, userId);
  }

  @Post(':id/like')
  likePost(@Param('id') id: string) {
    // For now, using a hardcoded user ID. In production, this should come from JWT token
    const userId = 1; // Replace with actual user ID from authentication
    return this.postsService.likePost(id, userId);
  }
}
