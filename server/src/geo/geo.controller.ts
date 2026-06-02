import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { GeoService } from './geo.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { Public } from '../auth/decorators/public.decorator';
import { assertUserOwnership } from '../auth/utils/assert-user-ownership.util';

@Controller('geo')
export class GeoController {
  constructor(private geo: GeoService) {}

  @Public()
  @Get('cities')
  listCities() {
    return this.geo.listCities();
  }

  @Public()
  @Get('cities/:id/districts')
  listDistricts(@Param('id') id: string) {
    return this.geo.listDistricts(+id);
  }

  @Get('users/:id/addresses')
  listUserAddresses(@Req() req: Request, @Param('id') id: string) {
    assertUserOwnership(req, id);
    return this.geo.listUserAddresses(+id);
  }

  @Post('users/:id/addresses')
  createAddress(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    assertUserOwnership(req, id);
    return this.geo.createAddress(+id, createAddressDto);
  }
}
