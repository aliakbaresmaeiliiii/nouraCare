import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MenstrualModule } from './menstrual/menstrual.module';
import { ReproductiveStateService } from './reproductive-state.service';
import { ReproductiveStateController } from './reproductive-state.controller';
import { CycleService } from './services/cycle.service';
import { PlanningService } from './services/planning.service';
import { PregnancyService } from './services/pregnancy.service';
import { MenopauseService } from './services/menopause.service';

@Module({
  imports: [PrismaModule, MenstrualModule],
  providers: [
    ReproductiveStateService,
    CycleService,
    PlanningService,
    PregnancyService,
    MenopauseService,
  ],
  controllers: [ReproductiveStateController],
  exports: [ReproductiveStateService, MenstrualModule],
})
export class ReproductiveModule {}
