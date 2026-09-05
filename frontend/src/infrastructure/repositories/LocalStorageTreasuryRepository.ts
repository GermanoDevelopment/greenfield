import type { ITreasuryRepository } from '../../core/domain/ports';
import type { Treasury } from '../../core/domain/types';
import { INITIAL_TREASURY } from '../data/mockData';

const TREASURY_STORAGE_KEY = 'greenfield_treasury_v1';

export class LocalStorageTreasuryRepository implements ITreasuryRepository {
  private getStore(): Treasury {
    try {
      const raw = localStorage.getItem(TREASURY_STORAGE_KEY);
      if (!raw) {
        this.saveStore(INITIAL_TREASURY);
        return INITIAL_TREASURY;
      }
      return JSON.parse(raw);
    } catch {
      return INITIAL_TREASURY;
    }
  }

  private saveStore(treasury: Treasury): void {
    try {
      localStorage.setItem(TREASURY_STORAGE_KEY, JSON.stringify(treasury));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  async getTreasury(): Promise<Treasury> {
    return this.getStore();
  }

  async reserveFunds(amountUsdc: number): Promise<boolean> {
    const store = this.getStore();
    if (store.available_usdc < amountUsdc) {
      return false;
    }

    store.reserved_usdc += amountUsdc;
    store.available_usdc = store.total_usdc - store.reserved_usdc - store.claimed_usdc;
    this.saveStore(store);
    return true;
  }

  async claimFunds(amountUsdc: number): Promise<boolean> {
    const store = this.getStore();
    store.reserved_usdc = Math.max(0, store.reserved_usdc - amountUsdc);
    store.claimed_usdc += amountUsdc;
    store.available_usdc = store.total_usdc - store.reserved_usdc - store.claimed_usdc;
    this.saveStore(store);
    return true;
  }

  async resetToDefault(): Promise<Treasury> {
    this.saveStore(INITIAL_TREASURY);
    return INITIAL_TREASURY;
  }
}
