/**
 * GREENFIELD Domain Types & Models
 * Fiel à especificação do MVP (Seção 8 e Seção 9)
 */

export type BountyStatus =
  | 'DRAFT'
  | 'FUNDED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'PR_OPEN'
  | 'MERGED'
  | 'CLAIMABLE'
  | 'CLAIMED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'VERIFICATION_FAILED'
  | 'CLAIM_FAILED';

export type UserRole = 'maintainer' | 'developer' | 'both';

export const POINTS_PER_USDC = 100;

export function pointsToUsdc(points: number): number {
  return points / POINTS_PER_USDC;
}

export function usdcToPoints(usdc: number): number {
  return usdc * POINTS_PER_USDC;
}

export interface User {
  id: string;
  github_id: number;
  github_username: string;
  avatar_url?: string;
  wallet_address: string;
  role: UserRole;
  created_at: string;
}

export interface Repository {
  id: string;
  github_repository_id: number;
  owner: string;
  name: string;
  github_url: string;
  maintainer_user_id: string;
  default_branch?: string;
}

export interface Issue {
  id: string;
  github_issue_id: number;
  repository_id: string;
  number: number;
  title: string;
  description?: string;
  url: string;
  status: 'OPEN' | 'CLOSED';
}

export interface PullRequest {
  id: string;
  bounty_id: string;
  github_pr_id: number;
  number: number;
  title: string;
  url: string;
  author_github_username: string;
  merged: boolean;
  merged_at?: string;
}

export interface Claim {
  id: string;
  bounty_id: string;
  developer_id: string;
  wallet_address: string;
  usdc_amount: number;
  transaction_signature: string;
  status: 'CONFIRMED' | 'PENDING' | 'FAILED';
  created_at: string;
}

export interface Bounty {
  id: string;
  issue_id: string;
  issue?: Issue;
  repository_id: string;
  repository?: Repository;
  maintainer_id: string;
  maintainer?: User;
  developer_id?: string;
  developer?: User;
  points: number;
  usdc_amount: number;
  status: BountyStatus;
  created_at: string;
  accepted_at?: string;
  merged_at?: string;
  claimed_at?: string;
  pr?: PullRequest;
  claim?: Claim;
}

export interface Treasury {
  total_usdc: number;
  reserved_usdc: number;
  claimed_usdc: number;
  available_usdc: number;
}
