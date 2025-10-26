import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ForumCategoriesService } from './forum-categories.service';
import { CreateForumCategoryDto } from './dto/create-forum-category.dto';
import { UpdateForumCategoryDto } from './dto/update-forum-category.dto';

@Controller('api/v1/forum-categories')
export class ForumCategoriesController {
  constructor(
    private readonly forumCategoriesService: ForumCategoriesService,
  ) {}

  @Post()
  async create(@Body() createForumCategoryDto: CreateForumCategoryDto) {
    const category = await this.forumCategoriesService.create(
      createForumCategoryDto,
    );
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

  @Get('name/:name')
  async findByName(@Param('name') name: string) {
    const category = await this.forumCategoriesService.findByName(name);
    return {
      success: true,
      data: category,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateForumCategoryDto: UpdateForumCategoryDto,
  ) {
    const category = await this.forumCategoriesService.update(
      id,
      updateForumCategoryDto,
    );
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
    const categoryWithStats =
      await this.forumCategoriesService.getCategoryStats(id);
    return {
      success: true,
      data: categoryWithStats,
    };
  }
}
