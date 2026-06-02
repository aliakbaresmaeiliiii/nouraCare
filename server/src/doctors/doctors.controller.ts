import { Controller, Get, Param, Query } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Public()
  @Get()
  findPage(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
    @Query('specialty') specialty?: string,
    @Query('consultationType') consultationType?: string,
  ) {
    const page = Math.max(1, parseInt(pageStr || '1', 10) || 1);
    const rawLimit = parseInt(limitStr || '12', 10) || 12;
    const limit = Math.min(50, Math.max(1, rawLimit));
    return this.doctorsService.findPage({
      page,
      limit,
      search,
      specialty,
      consultationType,
    });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }
}
