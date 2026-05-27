import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReproductiveStateService } from './reproductive-state.service';
import { UpdateReproductiveStateDto } from './dto/update-reproductive-state.dto';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class ReproductiveStateController {
  constructor(private readonly reproductiveStateService: ReproductiveStateService) {}

  @Get('dashboard')
  async getDashboard(@Req() req: Request) {
    const user = req.user as { id: number };
    return this.reproductiveStateService.getDashboard(user.id);
  }

  @Patch(':id/state')
  async updateState(@Req() req: Request, @Body() dto: UpdateReproductiveStateDto) {
    const user = req.user as { id: number };
    return this.reproductiveStateService.updateState(user.id, dto);
  }
}
