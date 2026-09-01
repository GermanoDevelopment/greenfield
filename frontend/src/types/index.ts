export type BountyStatus = 'OPEN' | 'ASSIGNED' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: number;
  github_id: number;
  username: string;
  avatar_url?: string;
  wallet?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  owner_id: number;
  owner?: User;
  github_repo: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Bounty {
  id: number;
  project_id: number;
  project?: Project;
  issuer_id: number;
  issuer?: User;
  hunter_id?: number;
  hunter?: User;
  issue_url: string;
  amount_usdc: number;
  status: BountyStatus;
  escrow_pda?: string;
  created_at: string;
  updated_at: string;
}
