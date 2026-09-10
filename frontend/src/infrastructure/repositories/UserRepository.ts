import type { IUserRepository } from '../../core/domain/ports';
import type { User } from '../../core/domain/types';
import { MOCK_USERS } from '../data/mockData';

const USER_SESSION_KEY = 'greenfield_current_user_v1';

export const GUEST_USER: User = {
  id: '',
  github_id: null,
  github_username: 'visitante',
  name: 'Visitante',
  email: null,
  avatar_url: '',
  wallet_address: '',
  role: 'CONTRIBUTOR',
  created_at: '',
};

export class UserRepository implements IUserRepository {
  private currentUser: User;

  constructor() {
    const hasJwt = typeof window !== 'undefined' && !!localStorage.getItem('greenfield_jwt');
    const saved = typeof window !== 'undefined' ? localStorage.getItem(USER_SESSION_KEY) : null;
    if (hasJwt && saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch {
        this.currentUser = GUEST_USER;
      }
    } else {
      this.currentUser = GUEST_USER;
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
