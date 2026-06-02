import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ForumThreadsService } from './forum-threads.service';
import { CreateForumThreadDto } from './dto/create-forum-thread.dto';
import { UpdateForumThreadDto } from './dto/update-forum-thread.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('forum-threads')
export class ForumThreadsController {
  constructor(private readonly forumThreadsService: ForumThreadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createForumThreadDto: CreateForumThreadDto,
    @Req() req: any,
  ) {
    // Get the user ID from the authenticated request
    const authorId = req.user.id;

    const thread = await this.forumThreadsService.create(
      createForumThreadDto,
      authorId,
    );
    return {
      success: true,
      message: 'Forum thread created successfully',
      data: thread,
    };
  }

  @Public()
  @Get()
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const result = await this.forumThreadsService.findAll(
      categoryId,
      parseInt(page),
      parseInt(limit),
    );
    return {
      success: true,
      data: result,
    };
  }

  @Get('me/activity')
  @UseGuards(JwtAuthGuard)
  async getMyActivity(
    @Req() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const userId = req.user.id;
    const result = await this.forumThreadsService.getUserActivity(
      userId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
    return {
      success: true,
      data: result,
    };
  }

  @Public()
  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    if (!query) {
      return {
        success: true,
        data: {
          threads: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          },
        },
      };
    }

    const result = await this.forumThreadsService.search(
      query,
      parseInt(page),
      parseInt(limit),
    );
    return {
      success: true,
      data: result,
    };
  }

  @Public()
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('viewerId') viewerId?: string,
  ) {
    const parsedViewerId =
      viewerId != null && viewerId !== '' ? Number(viewerId) : NaN;
    const thread = await this.forumThreadsService.findOne(
      id,
      Number.isFinite(parsedViewerId) ? parsedViewerId : undefined,
    );
    return {
      success: true,
      data: thread,
    };
  }

  @Public()
  @Get('category/:categoryId')
  async findByCategory(
    @Param('categoryId') categoryId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const threads = await this.forumThreadsService.findAll(
      categoryId,
      page,
      limit,
    );
    return {
      success: true,
      data: threads,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateForumThreadDto: UpdateForumThreadDto,
    @Req() req: any,
  ) {
    // Get the user ID from the authenticated request
    const userId = req.user.id;

    const thread = await this.forumThreadsService.update(
      id,
      updateForumThreadDto,
      userId,
    );
    return {
      success: true,
      message: 'Forum thread updated successfully',
      data: thread,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Req() req: any) {
    // Get the user ID from the authenticated request
    const userId = req.user.id;

    await this.forumThreadsService.remove(id, userId);
    return {
      success: true,
      message: 'Forum thread deleted successfully',
    };
  }
}
