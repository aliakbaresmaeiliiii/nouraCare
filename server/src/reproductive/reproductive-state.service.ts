import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { InitializeReproductiveStateDto } from './dto/initialize-reproductive-state.dto';
import { UpdateReproductiveStateDto } from './dto/update-reproductive-state.dto';
import {
  ReproductiveState,
  fromPrismaReproductiveState,
  toPrismaReproductiveState,
} from './types/reproductive-state.type';
import { CycleService } from './services/cycle.service';
import { PlanningService } from './services/planning.service';
import { PregnancyService } from './services/pregnancy.service';

@Injectable()
export class ReproductiveStateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cycleService: CycleService,
    private readonly planningService: PlanningService,
    private readonly pregnancyService: PregnancyService,
  ) {}

  async initializeForUser(userId: number, dto: InitializeReproductiveStateDto) {
    // Commit writes first: `getDashboardData` uses the root Prisma client and must not run
    // while `tx` still holds locks from `upsertCycleData(tx, …)` (would hang / 500).
    await this.prisma.$transaction(async (tx) => {
      await this.ensureUserExists(tx, userId);
      await this.setState(tx, userId, dto.state);
      await this.syncDomainForState(tx, userId, dto.state, dto);
    });
    return this.buildDashboard(this.prisma, userId);
  }

  async updateState(userId: number, dto: UpdateReproductiveStateDto) {
    const nextState = dto.state;
  
    // Execute database operations within an atomic transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Ensure user exists
      await this.ensureUserExists(tx, userId);
      // 2. Retrieve current state and parse it
      const currentRecord = await tx.reproductive_state.findUnique({ 
        where: { userId } 
      });
      const currentState = currentRecord 
        ? fromPrismaReproductiveState(currentRecord.state) 
        : null;
  
      // 3. Perform state modification only if state changed or is new
      if (!currentRecord) {
        // Ensure setState maps 'nextState' correctly internally, or map it here:
        await this.setState(tx, userId, nextState);
      } else if (currentState !== nextState) {
        const nextStatePrisma = toPrismaReproductiveState(nextState);
        await tx.reproductive_state.update({
          where: { userId },
          data: { 
            state: nextStatePrisma, 
            updatedAt: new Date() // Omit this if your Prisma schema uses @updatedAt
          },
        });
      }
  
      // 4. Handle Lifecycle Transitions (State Machine Rules)
      
      // Leaving 'pregnant' -> Close active pregnancy
      if (currentState === 'pregnant' && nextState !== 'pregnant') {
        await this.pregnancyService.closeActivePregnancy(tx, userId);
      }
  
      // Entering 'pregnant' -> Optional: Auto-create pregnancy if not already handled
      // if (currentState !== 'pregnant' && nextState === 'pregnant') {
      //   await this.pregnancyService.startActivePregnancy(tx, userId);
      // }
  
      // 5. Sync other domains (ensure 'tx' is used inside this method)
      await this.syncDomainForState(tx, userId, nextState, dto);
    });
  
    // 6. Read operation outside the transaction block (Best practice for performance)
    return this.buildDashboard(this.prisma, userId);
  }
  

  async getDashboard(userId: number) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureUserExists(tx, userId);
      const existingState = await tx.reproductive_state.findUnique({ where: { userId } });
      if (!existingState) {
        await this.setState(tx, userId, 'cycle');
      }
      return this.buildDashboard(tx, userId);
    });
  }

  private async buildDashboard(tx: any, userId: number) {
    const stateRow = await tx.reproductive_state.findUnique({ where: { userId } });
    if (!stateRow) {
      return {
        state: 'cycle',
        tips: [] as string[],
        nextPeriod: null as Date | null,
        week: null as number | null,
        day: null as number | null,
        progress: null as number | null,
        cycleDay: null as number | null,
        ovulationDate: null as string | null,
        fertileWindow: null as { start: string; end: string } | null,
        confidence: null as number | null,
        avgCycleLength: null as number | null,
        avgPeriodLength: null as number | null,
        cycleLength: null as number | null,
        insight: null as string | null,
      };
    }
    const state = fromPrismaReproductiveState(stateRow.state);
    const base = {
      state,
      tips: [] as string[],
      nextPeriod: null as Date | null,
      week: null as number | null,
      day: null as number | null,
      progress: null as number | null,
      cycleDay: null as number | null,
      ovulationDate: null as string | null,
      fertileWindow: null as { start: string; end: string } | null,
      confidence: null as number | null,
      avgCycleLength: null as number | null,
      avgPeriodLength: null as number | null,
      cycleLength: null as number | null,
      insight: null as string | null,
    };

    const pregnancy = await this.pregnancyService.getDashboardData(tx, userId);

    if (state === 'pregnant') {
      if (pregnancy.week == null) {
        return {
          ...base,
          state: 'pregnant' as const,
          needsPregnancyInput: true,
          lastMenstrualPeriod: null as string | null,
        };
      }
      return {
        state: 'pregnant' as const,
        week: pregnancy.week,
        day: pregnancy.day,
        progress: pregnancy.progress,
        tips: pregnancy.tips,
        insight: pregnancy.insight ?? null,
        nextPeriod: null as Date | null,
        needsPregnancyInput: false,
        lastMenstrualPeriod: pregnancy.lastMenstrualPeriod,
      };
    }
    if (state === 'cycle' || state === 'postpartum') {
      const cycle = await this.cycleService.getDashboardData(userId);
      return {
        ...base,
        nextPeriod: cycle.nextPeriod,
        cycleDay: cycle.cycleDay,
        ovulationDate: cycle.ovulationDate,
        fertileWindow: cycle.fertileWindow,
        confidence: cycle.confidence,
        avgCycleLength: cycle.avgCycleLength,
        avgPeriodLength: cycle.avgPeriodLength,
        cycleLength: cycle.cycleLength,
        insight: cycle.insight,
      };
    }
    if (state === 'planning') {
      const planning = await this.planningService.getDashboardData(tx, userId);
      const cycle = await this.cycleService.getDashboardData(userId);
      return {
        ...base,
        tryingSince: planning.tryingSince,
        notes: planning.notes,
        nextPeriod: cycle.nextPeriod,
        cycleDay: cycle.cycleDay,
        ovulationDate: cycle.ovulationDate,
        fertileWindow: cycle.fertileWindow,
        confidence: cycle.confidence,
        avgCycleLength: cycle.avgCycleLength,
        avgPeriodLength: cycle.avgPeriodLength,
        cycleLength: cycle.cycleLength,
        insight: cycle.insight,
      };
    }
    return base;
  }

  private async syncDomainForState(
    tx: any,
    userId: number,
    state: ReproductiveState,
    dto: InitializeReproductiveStateDto | UpdateReproductiveStateDto,
  ) {
    if (state === 'pregnant') {
      await this.pregnancyService.upsertPregnancyData(tx, userId, {
        pregnancyStartDate: dto.pregnancyStartDate,
        currentWeek: dto.currentWeek,
        pregnancyDueDate: dto.pregnancyDueDate,
      });
      return;
    }
    if (state === 'planning') {
      await this.planningService.upsertPlanningData(tx, userId, {
        tryingSince: dto.tryingSince,
        notes: dto.notes,
      });
      return;
    }
    await this.cycleService.upsertCycleData(tx, userId, {
      lastPeriodDate: dto.lastPeriodDate,
      cycleLength: dto.cycleLength,
    });
  }

  private async setState(tx: any, userId: number, state: ReproductiveState) {
    await tx.reproductive_state.upsert({
      where: { userId },
      create: {
        userId,
        state: toPrismaReproductiveState(state),
        updatedAt: new Date(),
      },
      update: {
        state: toPrismaReproductiveState(state),
        updatedAt: new Date(),
      },
    });
  }

  private async ensureUserExists(tx: any, userId: number) {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
