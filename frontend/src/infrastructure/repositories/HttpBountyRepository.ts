import type { IBountyRepository } from '../../core/domain/ports';
import type { Bounty, BountyStatus, Proposal, User, Repository } from '../../core/domain/types';
import { microUsdcToUsdc, pointsToUsdc } from '../../lib/currency';
import { greenfieldApi, type ApiBountyOut, type ApiUserOut } from '../../services/api';

function parseRepoFromIssueUrl(url?: string): { owner: string; name: string } {
  if (!url) return { owner: 'greenfield', name: 'repo' };
  try {
    const match = url.match(/(?:github\.com|api\.github\.com\/repos)\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return { owner: match[1], name: match[2] };
    }
  } catch {}
  return { owner: 'greenfield', name: 'repo' };
}

function mapApiUserToDomain(user?: ApiUserOut): User | undefined {
  if (!user) return undefined;
  return {
    id: String(user.id),
    github_id: user.github_id,
    github_username: user.username,
    avatar_url: user.avatar_url || undefined,
    wallet_address: user.wallet || '',
    role: user.role === 'ADMIN' || user.role === 'MAINTAINER' ? 'maintainer' : 'developer',
    created_at: user.created_at,
  };
}

function mapApiStatusToDomain(status: string): BountyStatus {
  switch (status) {
    case 'OPEN':
      return 'OPEN_FOR_PROPOSALS';
    case 'ASSIGNED':
      return 'ASSIGNED';
    case 'SUBMITTED':
      return 'PR_OPEN';
    case 'CLAIMABLE':
      return 'CLAIMABLE';
    case 'CLAIMED':
      return 'CLAIMED';
    case 'CLAIM_FAILED':
      return 'CLAIM_FAILED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return 'OPEN_FOR_PROPOSALS';
  }
}

// Merge verified: the reward is unlocked whether or not it has been paid yet.
const MERGED_STATUSES = new Set(['CLAIMABLE', 'CLAIMED', 'CLAIM_FAILED']);

function mapApiBountyToDomain(api: ApiBountyOut): Bounty {
  const usdcAmount = api.amount_usdc ? microUsdcToUsdc(api.amount_usdc) : pointsToUsdc(api.points);
  const domainStatus = mapApiStatusToDomain(api.status);
  const repoInfo = parseRepoFromIssueUrl(api.issue_url);

  const repository: Repository = {
    id: String(api.repository_id || api.project_id || 1),
    github_repository_id: api.repository_id || 1,
    owner: repoInfo.owner,
    name: repoInfo.name,
    github_url: `https://github.com/${repoInfo.owner}/${repoInfo.name}`,
    maintainer_user_id: String(api.issuer_id),
    approved_for_round: true,
  };

  const proposals: Proposal[] = (api.applicants || []).map((app) => ({
    id: String(app.id),
    bounty_id: String(api.id),
    developer_id: String(app.user_id),
    developer: mapApiUserToDomain(app.user),
    cover_letter: app.proposal || '',
    estimated_days: 2,
    status: app.status,
    created_at: app.created_at,
  }));

  return {
    id: String(api.id),
    issue_id: String(api.issue_number || api.id),
    issue: {
      id: String(api.issue_number || api.id),
      github_issue_id: api.issue_number || 1,
      repository_id: String(api.repository_id || api.project_id),
      number: api.issue_number || 1,
      title: api.issue_title || 'GitHub Issue',
      description: api.issue_body || undefined,
      url: api.issue_url,
      status: MERGED_STATUSES.has(api.status) ? 'CLOSED' : 'OPEN',
    },
    repository_id: String(api.repository_id || api.project_id),
    repository,
    maintainer_id: String(api.issuer_id),
    maintainer: mapApiUserToDomain(api.issuer),
    developer_id: api.hunter_id ? String(api.hunter_id) : undefined,
    developer: mapApiUserToDomain(api.hunter),
    points: api.points,
    usdc_amount: usdcAmount,
    status: domainStatus,
    created_at: api.created_at,
    claimed_at: api.claimed_at || undefined,
    pr: api.pr_url
      ? {
          id: `pr-${api.id}`,
          bounty_id: String(api.id),
          github_pr_id: 1,
          number: 1,
          title: `Fix #${api.issue_number || api.id}`,
          url: api.pr_url,
          author_github_username: api.hunter?.username || 'hunter',
          merged: MERGED_STATUSES.has(api.status),
          merged_at: api.claimed_at || undefined,
        }
      : undefined,
    claim: api.tx_signature
      ? {
          id: `claim-${api.id}`,
          bounty_id: String(api.id),
          developer_id: String(api.hunter_id || ''),
          wallet_address: api.hunter?.wallet || '',
          usdc_amount: usdcAmount,
          transaction_signature: api.tx_signature,
          status: 'CONFIRMED',
          created_at: api.claimed_at || api.created_at,
        }
      : undefined,
    proposals,
    github_issue_assigned: Boolean(api.hunter_id),
  };
}

export class HttpBountyRepository implements IBountyRepository {
  async getAll(): Promise<Bounty[]> {
    const data = await greenfieldApi.listBounties();
    return data.map(mapApiBountyToDomain);
  }

  async getById(id: string): Promise<Bounty | null> {
    const numericId = parseInt(id.replace(/\D/g, ''), 10);
    if (isNaN(numericId)) return null;
    try {
      const data = await greenfieldApi.getBounty(numericId);
      return mapApiBountyToDomain(data);
    } catch {
      return null;
    }
  }

  async create(bountyData: Omit<Bounty, 'id' | 'created_at'>): Promise<Bounty> {
    const numericProjectId = parseInt(bountyData.repository_id.replace(/\D/g, ''), 10) || 1;
    const issueNum = bountyData.issue?.number || parseInt(bountyData.issue_id.replace(/\D/g, ''), 10) || 1;
    const issueUrl = bountyData.issue?.url || `https://github.com/GermanoDevelopment/greenfield/issues/${issueNum}`;

    const created = await greenfieldApi.createBounty({
      project_id: numericProjectId,
      issue_url: issueUrl,
      points: bountyData.points,
      amount_usdc: bountyData.usdc_amount ? Math.round(bountyData.usdc_amount * 1_000_000) : bountyData.points * 10_000,
      issue_number: issueNum,
      issue_title: bountyData.issue?.title,
      issue_body: bountyData.issue?.description,
    });

    return mapApiBountyToDomain(created);
  }

  async update(id: string, patch: Partial<Bounty>): Promise<Bounty> {
    const numericId = parseInt(id.replace(/\D/g, ''), 10);
    if (isNaN(numericId)) throw new Error(`Invalid bounty ID: ${id}`);

    // Se houver ajuste de recompensa (Invariante 2)
    if (patch.points !== undefined) {
      await greenfieldApi.updateBountyReward(numericId, patch.points);
    }

    // Se houver submissão de PR
    if (patch.pr?.url) {
      await greenfieldApi.submitBounty(numericId, patch.pr.url);
    }

    // Se houver completion/merge
    if (patch.status === 'CLAIMED' || patch.status === 'MERGED') {
      await greenfieldApi.completeBounty(numericId);
    }

    const updated = await greenfieldApi.getBounty(numericId);
    return mapApiBountyToDomain(updated);
  }

  async getByMaintainer(maintainerId: string): Promise<Bounty[]> {
    const list = await this.getAll();
    return list.filter((b) => b.maintainer_id === maintainerId);
  }

  async getByDeveloper(developerId: string): Promise<Bounty[]> {
    const list = await this.getAll();
    return list.filter(
      (b) =>
        b.developer_id === developerId ||
        b.proposals?.some((p) => p.developer_id === developerId)
    );
  }

  async addProposal(bountyId: string, proposal: Proposal): Promise<Bounty> {
    const numericId = parseInt(bountyId.replace(/\D/g, ''), 10);
    if (isNaN(numericId)) throw new Error(`Invalid bounty ID: ${bountyId}`);

    await greenfieldApi.applyToBounty(numericId, proposal.cover_letter);
    const updated = await greenfieldApi.getBounty(numericId);
    return mapApiBountyToDomain(updated);
  }

  async acceptProposal(bountyId: string, proposalId: string): Promise<Bounty> {
    const numericBountyId = parseInt(bountyId.replace(/\D/g, ''), 10);
    const numericApplicantId = parseInt(proposalId.replace(/\D/g, ''), 10);

    if (isNaN(numericBountyId) || isNaN(numericApplicantId)) {
      throw new Error(`Invalid IDs: bounty=${bountyId}, applicant=${proposalId}`);
    }

    const updated = await greenfieldApi.acceptBountyApplicant(numericBountyId, numericApplicantId);
    return mapApiBountyToDomain(updated);
  }
}
