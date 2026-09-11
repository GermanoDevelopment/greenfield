import type { IBountyRepository } from '../../core/domain/ports';
import type { Bounty, Proposal } from '../../core/domain/types';

const STORAGE_KEY = 'greenfield_bounties_v1';

export class LocalStorageBountyRepository implements IBountyRepository {
  private getStore(): Bounty[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.saveStore([]);
        return [];
      }
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveStore(bounties: Bounty[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bounties));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  async getAll(): Promise<Bounty[]> {
    return this.getStore();
  }

  async getById(id: string): Promise<Bounty | null> {
    const list = this.getStore();
    return list.find((b) => b.id === id) || null;
  }

  async create(bountyData: Omit<Bounty, 'id' | 'created_at'>): Promise<Bounty> {
    const list = this.getStore();
    const newId = `bounty-${Date.now()}`;
    const newBounty: Bounty = {
      ...bountyData,
      id: newId,
      created_at: new Date().toISOString(),
    };

    list.unshift(newBounty);
    this.saveStore(list);
    return newBounty;
  }

  async update(id: string, patch: Partial<Bounty>): Promise<Bounty> {
    const list = this.getStore();
    const index = list.findIndex((b) => b.id === id);
    if (index === -1) throw new Error(`Bounty ${id} not found`);

    const current = list[index];
    const updated: Bounty = {
      ...current,
      ...patch,
    };

    list[index] = updated;
    this.saveStore(list);
    return updated;
  }

  async getByMaintainer(maintainerId: string): Promise<Bounty[]> {
    const list = this.getStore();
    return list.filter((b) => b.maintainer_id === maintainerId);
  }

  async getByDeveloper(developerId: string): Promise<Bounty[]> {
    const list = this.getStore();
    return list.filter(
      (b) =>
        b.developer_id === developerId ||
        b.proposals?.some((p) => p.developer_id === developerId)
    );
  }

  async addProposal(bountyId: string, proposal: Proposal): Promise<Bounty> {
    const list = this.getStore();
    const index = list.findIndex((b) => b.id === bountyId);
    if (index === -1) throw new Error(`Bounty ${bountyId} não encontrada.`);

    const current = list[index];
    const proposals = current.proposals ? [...current.proposals] : [];
    
    // Evita duplicidade de proposta do mesmo desenvolvedor
    const existingIndex = proposals.findIndex((p) => p.developer_id === proposal.developer_id);
    if (existingIndex !== -1) {
      proposals[existingIndex] = proposal;
    } else {
      proposals.push(proposal);
    }

    const updated: Bounty = {
      ...current,
      proposals,
    };

    list[index] = updated;
    this.saveStore(list);
    return updated;
  }

  async acceptProposal(bountyId: string, proposalId: string): Promise<Bounty> {
    const list = this.getStore();
    const index = list.findIndex((b) => b.id === bountyId);
    if (index === -1) throw new Error(`Bounty ${bountyId} não encontrada.`);

    const current = list[index];
    if (!current.proposals) throw new Error('Esta bounty não possui propostas.');

    const acceptedProposal = current.proposals.find((p) => p.id === proposalId);
    if (!acceptedProposal) throw new Error(`Proposta ${proposalId} não encontrada.`);

    const updatedProposals = current.proposals.map((p) => ({
      ...p,
      status: p.id === proposalId ? ('ACCEPTED' as const) : ('REJECTED' as const),
    }));

    const updated: Bounty = {
      ...current,
      developer_id: acceptedProposal.developer_id,
      developer: acceptedProposal.developer,
      proposals: updatedProposals,
      status: 'ASSIGNED',
      accepted_at: new Date().toISOString(),
      github_issue_assigned: true,
    };

    list[index] = updated;
    this.saveStore(list);
    return updated;
  }

  reset(): void {
    this.saveStore([]);
  }
}
