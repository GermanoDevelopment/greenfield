import type { IBountyRepository } from '../../core/domain/ports';
import type { Bounty, Proposal } from '../../core/domain/types';
import { LocalStorageBountyRepository } from './LocalStorageBountyRepository';
import { HttpBountyRepository } from './HttpBountyRepository';
import { greenfieldApi } from '../../services/api';

export class HybridBountyRepository implements IBountyRepository {
  private localRepo = new LocalStorageBountyRepository();
  private httpRepo = new HttpBountyRepository();
  private isOnline = false;

  async checkConnectivity(): Promise<boolean> {
    try {
      await greenfieldApi.getHealth();
      this.isOnline = true;
    } catch {
      this.isOnline = false;
    }
    return this.isOnline;
  }

  get isConnectedToBackend(): boolean {
    return this.isOnline;
  }

  async getAll(): Promise<Bounty[]> {
    if (this.isOnline) {
      try {
        const remote = await this.httpRepo.getAll();
        return remote;
      } catch {
        this.isOnline = false;
      }
    }
    return this.localRepo.getAll();
  }

  async getById(id: string): Promise<Bounty | null> {
    if (this.isOnline) {
      try {
        const remote = await this.httpRepo.getById(id);
        if (remote) return remote;
      } catch {
        this.isOnline = false;
      }
    }
    return this.localRepo.getById(id);
  }

  async create(bountyData: Omit<Bounty, 'id' | 'created_at'>): Promise<Bounty> {
    if (this.isOnline) {
      try {
        const created = await this.httpRepo.create(bountyData);
        // Sync to local as well
        await this.localRepo.create({ ...bountyData, status: created.status });
        return created;
      } catch (err) {
        console.warn('Backend create failed, fallback to local:', err);
      }
    }
    return this.localRepo.create(bountyData);
  }

  async update(id: string, patch: Partial<Bounty>): Promise<Bounty> {
    if (this.isOnline) {
      try {
        return await this.httpRepo.update(id, patch);
      } catch (err) {
        console.warn('Backend update failed, fallback to local:', err);
      }
    }
    return this.localRepo.update(id, patch);
  }

  async getByMaintainer(maintainerId: string): Promise<Bounty[]> {
    if (this.isOnline) {
      try {
        return await this.httpRepo.getByMaintainer(maintainerId);
      } catch {
        this.isOnline = false;
      }
    }
    return this.localRepo.getByMaintainer(maintainerId);
  }

  async getByDeveloper(developerId: string): Promise<Bounty[]> {
    if (this.isOnline) {
      try {
        return await this.httpRepo.getByDeveloper(developerId);
      } catch {
        this.isOnline = false;
      }
    }
    return this.localRepo.getByDeveloper(developerId);
  }

  async addProposal(bountyId: string, proposal: Proposal): Promise<Bounty> {
    if (this.isOnline) {
      try {
        const updated = await this.httpRepo.addProposal(bountyId, proposal);
        await this.localRepo.addProposal(bountyId, proposal);
        return updated;
      } catch (err) {
        console.warn('Backend addProposal failed, fallback to local:', err);
      }
    }
    return this.localRepo.addProposal(bountyId, proposal);
  }

  async acceptProposal(bountyId: string, proposalId: string): Promise<Bounty> {
    if (this.isOnline) {
      try {
        const updated = await this.httpRepo.acceptProposal(bountyId, proposalId);
        await this.localRepo.acceptProposal(bountyId, proposalId);
        return updated;
      } catch (err) {
        console.warn('Backend acceptProposal failed, fallback to local:', err);
      }
    }
    return this.localRepo.acceptProposal(bountyId, proposalId);
  }

  reset(): void {
    this.localRepo.reset();
  }
}
