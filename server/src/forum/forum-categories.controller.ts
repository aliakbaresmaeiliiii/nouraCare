import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UsePipes, 
  ValidationPipe,
  HttpCode,
  HttpStatus 
} from '@nestjs/common';
import { ForumCategoriesService } from './forum-categories.service';
import { CreateForumCategoryDto } from './dto/create-forum-category.dto';
import { UpdateForumCategoryDto } from './dto/update-forum-category.dto';

@Controller('api/v1/forum-categories')

export class ForumCategoriesController {
  constructor(private readonly forumCategoriesService: ForumCategoriesService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createForumCategoryDto: CreateForumCategoryDto) {
    const category = await this.forumCategoriesService.create(createForumCategoryDto);
    return {
      success: true,
      message: 'Forum category created successfully',
      data: category,
    };
  }

  @Get()
  async findAll() {
    const categories = await this.forumCategoriesService.findAll();
    return {
      success: true,
      data: categories,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const category = await this.forumCategoriesService.findOne(id);
    return {
      success: true,
      data: category,
    };
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    const category = await this.forumCategoriesService.findBySlug(slug);
    return {
      success: true,
      data: category,
    };
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id') id: string,
    @Body() updateForumCategoryDto: UpdateForumCategoryDto,
  ) {
    const category = await this.forumCategoriesService.update(id, updateForumCategoryDto);
    return {
      success: true,
      message: 'Forum category updated successfully',
      data: category,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.forumCategoriesService.remove(id);
    return {
      success: true,
      message: 'Forum category deleted successfully',
    };
  }

  @Post(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    const category = await this.forumCategoriesService.deactivate(id);
    return {
      success: true,
      message: 'Forum category deactivated successfully',
      data: category,
    };
  }

  @Get(':id/stats')
  async getCategoryStats(@Param('id') id: string) {
    const categoryWithStats = await this.forumCategoriesService.getCategoryStats(id);
    return {
      success: true,
      data: categoryWithStats,
    };
  }
}
