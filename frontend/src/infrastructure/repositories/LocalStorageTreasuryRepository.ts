import type { ITreasuryRepository } from '../../core/domain/ports';
import type { Treasury } from '../../core/domain/types';
import { greenfieldApi } from '../../services/api';

const TOTAL_COMMUNITY_POOL = 25000;

export class LocalStorageTreasuryRepository implements ITreasuryRepository {
  async getTreasury(): Promise<Treasury> {
    try {
      const bounties = await greenfieldApi.listBounties();
      let reserved = 0;
      let claimed = 0;

      for (const b of bounties) {
        const usdc = b.amount_usdc
          ? b.amount_usdc / 1_000_000
          : (b.points || 0) / 100;

        if (b.status === 'COMPLETED') {
          claimed += usdc;
        } else if (
          b.status === 'OPEN' ||
          b.status === 'ASSIGNED' ||
          b.status === 'SUBMITTED'
        ) {
          reserved += usdc;
        }
      }

      const available = Math.max(0, TOTAL_COMMUNITY_POOL - reserved - claimed);

      return {
        total_usdc: TOTAL_COMMUNITY_POOL,
        reserved_usdc: reserved,
        claimed_usdc: claimed,
        available_usdc: available,
      };
    } catch {
      return {
        total_usdc: TOTAL_COMMUNITY_POOL,
        reserved_usdc: 0,
        claimed_usdc: 0,
        available_usdc: TOTAL_COMMUNITY_POOL,
      };
    }
  }

  async reserveFunds(amountUsdc: number): Promise<boolean> {
    const t = await this.getTreasury();
    return t.available_usdc >= amountUsdc;
  }

  async claimFunds(_amountUsdc: number): Promise<boolean> {
    return true;
  }

  async resetToDefault(): Promise<Treasury> {
    return this.getTreasury();
  }
}
