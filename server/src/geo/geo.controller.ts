import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GeoService } from './geo.service';

@Controller('api/v1/geo')
export class GeoController {
  constructor(private geo: GeoService) {}

  @Get('cities')
  listCities() {
    return this.geo.listCities();
  }

  @Get('cities/:id/districts')
  listDistricts(@Param('id') id: string) {
    return this.geo.listDistricts(+id);
  }

  @Get('users/:id/addresses')
  listUserAddresses(@Param('id') id: string) {
    return this.geo.listUserAddresses(+id);
  }

  @Post('users/:id/addresses')
  createAddress(@Param('id') id: string, @Body() body: any) {
    return this.geo.createAddress(+id, body);
  }
}


