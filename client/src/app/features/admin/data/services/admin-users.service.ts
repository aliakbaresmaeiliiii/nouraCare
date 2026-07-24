import { Injectable, signal } from '@angular/core';
import { AdminUser, AdminUserStatus } from '../models/admin.models';
import { MOCK_USERS } from '../mocks/users.mock';

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  readonly users = signal<AdminUser[]>([...MOCK_USERS]);

  getById(id: string): AdminUser | undefined {
    return this.users().find((u) => u.id === id);
  }

  updateStatus(ids: string[], status: AdminUserStatus): void {
    this.users.update((list) =>
      list.map((u) => (ids.includes(u.id) ? { ...u, status } : u)),
    );
  }

  remove(ids: string[]): void {
    this.users.update((list) => list.filter((u) => !ids.includes(u.id)));
  }
}
