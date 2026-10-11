import type { ITreasuryRepository } from '../../core/domain/ports';
import type { Treasury } from '../../core/domain/types';
import { greenfieldApi } from '../../services/api';
import { fetchOnChainTreasury } from '../../lib/greenfieldProgram';

export class LocalStorageTreasuryRepository implements ITreasuryRepository {
  async getTreasury(): Promise<Treasury> {
    // 1. Prioridade 1: Endpoint de tesouro do backend (/api/v1/treasury/balance)
    try {
      const liveBalance = await greenfieldApi.getTreasuryBalance();
      if (liveBalance && typeof liveBalance.available_usdc === 'number') {
        return {
          total_usdc: liveBalance.total_deposited_usdc ?? (liveBalance.total_deposited / 1_000_000),
          reserved_usdc: liveBalance.total_reserved_usdc ?? (liveBalance.total_reserved / 1_000_000),
          claimed_usdc: liveBalance.total_claimed_usdc ?? (liveBalance.total_claimed / 1_000_000),
          available_usdc: liveBalance.available_usdc,
        };
      }
    } catch {
      // Endpoint do backend não disponível ou offline; tenta direto on-chain
    }

    // 2. Prioridade 2: Leitura direta da conta Anchor Treasury on-chain via Solana RPC
    try {
      const onchain = await fetchOnChainTreasury();
      if (onchain) {
        return {
          total_usdc: onchain.total_deposited_usdc,
          reserved_usdc: onchain.total_reserved_usdc,
          claimed_usdc: onchain.total_claimed_usdc,
          available_usdc: onchain.available_usdc,
        };
      }
    } catch {
      // Solana RPC offline ou não configurado
    }

    // 3. Fallback: Cálculo derivado da lista de bounties registradas
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

      const totalPool = reserved + claimed;
      return {
        total_usdc: totalPool,
        reserved_usdc: reserved,
        claimed_usdc: claimed,
        available_usdc: Math.max(0, totalPool - reserved),
      };
    } catch {
      return {
        total_usdc: 0,
        reserved_usdc: 0,
        claimed_usdc: 0,
        available_usdc: 0,
      };
    }
  }

  async reserveFunds(amountUsdc: number): Promise<boolean> {
    const t = await this.getTreasury();
    return t.available_usdc >= amountUsdc;
  }

  async claimFunds(amountUsdc: number): Promise<boolean> {
    const t = await this.getTreasury();
    return t.reserved_usdc >= amountUsdc;
  }

  async resetToDefault(): Promise<Treasury> {
    return this.getTreasury();
  }
}
