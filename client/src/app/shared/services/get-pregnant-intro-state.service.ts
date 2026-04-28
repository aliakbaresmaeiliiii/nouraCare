import { Injectable } from '@angular/core';

export interface GetPregnantIntroState {
  completedAt: string | null;
  answers: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class GetPregnantIntroStateService {
  private readonly storageKey = 'getPregnantIntroState';

  setAnswer(stepKey: string, answerId: string): void {
    const next = this.read();
    next.answers[stepKey] = answerId;
    this.write(next);
  }

  markCompleted(): GetPregnantIntroState {
    const next = this.read();
    next.completedAt = new Date().toISOString();
    this.write(next);
    return next;
  }

  getSnapshot(): GetPregnantIntroState {
    return this.read();
  }

  private read(): GetPregnantIntroState {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return { completedAt: null, answers: {} };
      const parsed = JSON.parse(raw) as Partial<GetPregnantIntroState>;
      return {
        completedAt: typeof parsed.completedAt === 'string' ? parsed.completedAt : null,
        answers: typeof parsed.answers === 'object' && parsed.answers ? parsed.answers : {},
      };
    } catch {
      return { completedAt: null, answers: {} };
    }
  }

  private write(state: GetPregnantIntroState): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      // noop
    }
  }
}
