import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReproductiveStateService } from './reproductive-state.service';
import { ReproductiveStateController } from './reproductive-state.controller';
import { CycleService } from './services/cycle.service';
import { PlanningService } from './services/planning.service';
import { PregnancyService } from './services/pregnancy.service';
import { MenopauseService } from './services/menopause.service';

@Module({
  imports: [PrismaModule],
  providers: [
    ReproductiveStateService,
    CycleService,
    PlanningService,
    PregnancyService,
    MenopauseService,
  ],
  controllers: [ReproductiveStateController],
  exports: [ReproductiveStateService],
})
export class ReproductiveModule {}
