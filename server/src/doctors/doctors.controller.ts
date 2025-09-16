import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto';

@Controller('api/v1/doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  // @Post()
  // @HttpCode(HttpStatus.CREATED)
  // create(@Body() createDoctorDto: CreateDoctorDto) {
  //   return this.doctorsService.create(createDoctorDto);
  // }

  @Get()
  findAll(
    @Query('specialty') specialty?: string,
    @Query('location') location?: string,
    @Query('consultationType') consultationType?: string,
  ) {
    if (specialty) {
      return this.doctorsService.findBySpecialty(specialty);
    }
    if (location) {
      return this.doctorsService.findByLocation(location);
    }
    if (consultationType) {
      return this.doctorsService.findByConsultationType(consultationType);
    }
    return this.doctorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDoctorDto: UpdateDoctorDto) {
    return this.doctorsService.update(id, updateDoctorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.doctorsService.remove(id);
  }
}
