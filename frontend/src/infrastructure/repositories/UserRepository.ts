import type { IUserRepository } from '../../core/domain/ports';
import type { User } from '../../core/domain/types';
import { MOCK_USERS } from '../data/mockData';

const USER_SESSION_KEY = 'greenfield_current_user_v1';

export class UserRepository implements IUserRepository {
  private currentUser: User;

  constructor() {
    const saved = localStorage.getItem(USER_SESSION_KEY);
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch {
        this.currentUser = MOCK_USERS.maintainer;
      }
    } else {
      this.currentUser = MOCK_USERS.maintainer;
    }
  }

  getCurrentUser(): User {
    return this.currentUser;
  }

  setCurrentUser(user: User): void {
    this.currentUser = user;
    try {
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  async getAllUsers(): Promise<User[]> {
    return Object.values(MOCK_USERS);
  }

  async getById(id: string): Promise<User | null> {
    const users = Object.values(MOCK_USERS);
    return users.find((u) => u.id === id) || null;
  }
}
