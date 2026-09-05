import type { Bounty, Claim, Issue, Repository, Treasury, User } from './types';

export interface IBountyRepository {
  getAll(): Promise<Bounty[]>;
  getById(id: string): Promise<Bounty | null>;
  create(bountyData: Omit<Bounty, 'id' | 'created_at'>): Promise<Bounty>;
  update(id: string, patch: Partial<Bounty>): Promise<Bounty>;
  getByMaintainer(maintainerId: string): Promise<Bounty[]>;
  getByDeveloper(developerId: string): Promise<Bounty[]>;
}

export interface ITreasuryRepository {
  getTreasury(): Promise<Treasury>;
  reserveFunds(amountUsdc: number): Promise<boolean>;
  claimFunds(amountUsdc: number): Promise<boolean>;
  resetToDefault(): Promise<Treasury>;
}

export interface IUserRepository {
  getCurrentUser(): User;
  setCurrentUser(user: User): void;
  getAllUsers(): Promise<User[]>;
  getById(id: string): Promise<User | null>;
}

export interface IGitHubService {
  listRepositories(): Promise<Repository[]>;
  listIssues(repositoryId?: string): Promise<Issue[]>;
  getIssueById(issueId: string): Promise<Issue | null>;
}

export interface ISolanaService {
  signAndExecuteClaim(
    bountyId: string,
    developerWallet: string,
    amountUsdc: number
  ): Promise<Claim>;
  getExplorerUrl(txSignature: string): string;
}
