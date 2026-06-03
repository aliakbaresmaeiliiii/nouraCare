import { Injectable } from '@angular/core';

export interface TrackerEntry {
  date: string;
  value: number;
  label?: string;
  notes?: string;
}

export interface ChecklistState {
  [itemId: string]: boolean;
}

export interface MemoryEntry {
  id: string;
  title: string;
  note: string;
  date: string;
  emoji: string;
}

export interface KickSession {
  id: string;
  startedAt: string;
  kicks: number;
  durationMinutes: number;
}

export interface GrowthEntry {
  date: string;
  weightKg: number;
  heightCm: number;
}

@Injectable({ providedIn: 'root' })
export class ToolStorageService {
  private prefix = 'noura_tool_';

  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }

  getTracker(pageId: string): TrackerEntry[] {
    return this.get<TrackerEntry[]>(`tracker_${pageId}`, []);
  }

  addTrackerEntry(pageId: string, entry: TrackerEntry): TrackerEntry[] {
    const list = [...this.getTracker(pageId), entry];
    this.set(`tracker_${pageId}`, list);
    return list;
  }

  getChecklist(pageId: string): ChecklistState {
    return this.get<ChecklistState>(`checklist_${pageId}`, {});
  }

  toggleChecklistItem(pageId: string, itemId: string): ChecklistState {
    const state = { ...this.getChecklist(pageId) };
    state[itemId] = !state[itemId];
    this.set(`checklist_${pageId}`, state);
    return state;
  }

  getMemories(): MemoryEntry[] {
    return this.get<MemoryEntry[]>('memory_album', []);
  }

  addMemory(entry: MemoryEntry): MemoryEntry[] {
    const list = [entry, ...this.getMemories()];
    this.set('memory_album', list);
    return list;
  }

  removeMemory(id: string): MemoryEntry[] {
    const list = this.getMemories().filter((m) => m.id !== id);
    this.set('memory_album', list);
    return list;
  }

  getKickSessions(): KickSession[] {
    return this.get<KickSession[]>('kick_sessions', []);
  }

  saveKickSession(session: KickSession): KickSession[] {
    const list = [session, ...this.getKickSessions()];
    this.set('kick_sessions', list);
    return list;
  }

  getGrowthEntries(): GrowthEntry[] {
    return this.get<GrowthEntry[]>('growth_chart', []);
  }

  addGrowthEntry(entry: GrowthEntry): GrowthEntry[] {
    const list = [...this.getGrowthEntries(), entry].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    this.set('growth_chart', list);
    return list;
  }

  getFavoriteNames(): string[] {
    return this.get<string[]>('baby_names_fav', []);
  }

  toggleFavoriteName(name: string): string[] {
    const favs = this.getFavoriteNames();
    const next = favs.includes(name)
      ? favs.filter((n) => n !== name)
      : [...favs, name];
    this.set('baby_names_fav', next);
    return next;
  }

  getCordBloodRegistration(): Record<string, string> | null {
    return this.get<Record<string, string> | null>('cord_blood', null);
  }

  saveCordBloodRegistration(data: Record<string, string>): void {
    this.set('cord_blood', data);
  }
}
