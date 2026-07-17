import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/** Shape of `localStorage.userInfo` JSON (nested `user` + top-level fields vary by flow). */
export type UserInfoStore = Record<string, unknown> & {
  user?: Record<string, unknown>;
  id?: number | string;
  userId?: number | string;
  data?: { id?: number | string };
};

@Injectable({ providedIn: 'root' })
export class UserSessionService {
  private readonly userUpdatedSubject = new Subject<Record<string, unknown>>();
  /** Emits after `mergeIntoStoredUser` so header/settings can refresh avatars. */
  readonly userUpdated$: Observable<Record<string, unknown>> =
    this.userUpdatedSubject.asObservable();

  parseUserInfoStore(): UserInfoStore | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    try {
      const raw = localStorage.getItem('userInfo');
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as UserInfoStore)
        : null;
    } catch {
      return null;
    }
  }

  /** Same as parse, or `{}` when missing/invalid (for UI that used `|| '{}'`). */
  getUserInfoStoreOrEmpty(): UserInfoStore {
    return this.parseUserInfoStore() ?? {};
  }

  setUserInfoStore(store: UserInfoStore): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem('userInfo', JSON.stringify(store));
  }

  /**
   * Single rule for numeric app user id: `user.id`, then top-level `id`, then `userId`.
   * Returns 0 when unknown (avoid defaulting to another user's id).
   */
  getCurrentUserId(): number {
    const store = this.parseUserInfoStore();
    if (!store) {
      return 0;
    }
    const u = store.user;
    const raw =
      u?.['id'] ??
      store['data']?.['id'] ??
      store['id'] ??
      store['userId'];
    if (raw === undefined || raw === null || raw === '') {
      return 0;
    }
    const n =
      typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  /** For code that keys onboarding completion by string user id. */
  getCurrentUserIdString(): string | null {
    const id = this.getCurrentUserId();
    return id > 0 ? String(id) : null;
  }

  mergeIntoStoredUser(partial: Record<string, unknown>): void {
    const store = this.getUserInfoStoreOrEmpty();
    const prev = (store.user ?? {}) as Record<string, unknown>;
    store.user = { ...prev, ...partial };
    this.setUserInfoStore(store);
    this.userUpdatedSubject.next(store.user);
  }
}
