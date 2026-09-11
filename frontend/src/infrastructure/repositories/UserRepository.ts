import type { IUserRepository } from '../../core/domain/ports';
import type { User } from '../../core/domain/types';
import { greenfieldApi, type ApiUserOut } from '../../services/api';

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

function mapApiUserToDomain(api: ApiUserOut): User {
  return {
    id: String(api.id),
    github_id: api.github_id,
    github_username: api.username,
    email: api.email || null,
    name: api.username,
    avatar_url: api.avatar_url || undefined,
    wallet_address: api.wallet || '',
    role: api.role,
    created_at: api.created_at,
  };
}

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
    try {
      const apiUsers = await greenfieldApi.listUsers();
      return apiUsers.map(mapApiUserToDomain);
    } catch (err) {
      console.warn('Erro ao listar usuários da API:', err);
      return this.currentUser.id ? [this.currentUser] : [];
    }
  }

  async getById(id: string): Promise<User | null> {
    if (this.currentUser.id === id) return this.currentUser;
    try {
      const all = await this.getAllUsers();
      return all.find((u) => u.id === id) || null;
    } catch {
      return null;
    }
  }
}
