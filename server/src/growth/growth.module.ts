import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReproductiveModule } from '../reproductive/reproductive.module';
import { GrowthService } from './growth.service';
import { GrowthController } from './growth.controller';
import { GrowthPublicController } from './growth-public.controller';

@Module({
  imports: [PrismaModule, ReproductiveModule],
  controllers: [GrowthController, GrowthPublicController],
  providers: [GrowthService],
  exports: [GrowthService],
})
export class GrowthModule {}
