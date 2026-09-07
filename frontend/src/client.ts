import { createClient } from '@solana/kit';
import { solanaRpc } from '@solana/kit-plugin-rpc';
import { walletSigner } from '@solana/kit-plugin-wallet';
import type { SolanaChain } from '@solana/wallet-standard-chains';
import { isSolanaChain } from '@solana/wallet-standard-chains';

const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

function resolveChainFromHostname(hostname: string): SolanaChain | null {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();

  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    return 'solana:localnet';
  }
  if (/(^|\.)mainnet(-beta)?(\.|$)/.test(host)) return 'solana:mainnet';
  if (/(^|\.)testnet(\.|$)/.test(host)) return 'solana:testnet';
  if (/(^|\.)devnet(\.|$)/.test(host)) return 'solana:devnet';

  return null;
}

function resolveChain(rpcUrl: string): SolanaChain {
  const fromEnv = import.meta.env.VITE_SOLANA_CHAIN;
  if (typeof fromEnv === 'string' && fromEnv.includes(':')) {
    const candidate = fromEnv as `${string}:${string}`;
    if (isSolanaChain(candidate)) {
      return candidate;
    }
    throw new Error(
      `Invalid VITE_SOLANA_CHAIN="${fromEnv}". Use solana:mainnet|devnet|testnet|localnet.`,
    );
  }

  try {
    const { hostname } = new URL(rpcUrl);
    const inferred = resolveChainFromHostname(hostname);
    if (inferred) return inferred;
  } catch {
    throw new Error(`Invalid VITE_SOLANA_RPC_URL="${rpcUrl}".`);
  }

  throw new Error(
    `Cannot infer Solana chain from RPC host "${rpcUrl}". Set VITE_SOLANA_CHAIN explicitly (e.g. solana:devnet).`,
  );
}

export const SOLANA_RPC_URL = RPC_URL;
export const SOLANA_CHAIN = resolveChain(RPC_URL);

export function getChainDisplayLabel(chain: SolanaChain = SOLANA_CHAIN): string {
  switch (chain) {
    case 'solana:mainnet':
      return 'Solana Mainnet';
    case 'solana:devnet':
      return 'Solana Devnet';
    case 'solana:testnet':
      return 'Solana Testnet';
    case 'solana:localnet':
      return 'Solana Localnet';
  }
}

export function getExplorerCluster(chain: SolanaChain = SOLANA_CHAIN): string | null {
  switch (chain) {
    case 'solana:mainnet':
      return null;
    case 'solana:devnet':
      return 'devnet';
    case 'solana:testnet':
      return 'testnet';
    case 'solana:localnet':
      return 'custom';
  }
}

export const solanaClient = createClient()
  .use(walletSigner({ chain: SOLANA_CHAIN }))
  .use(solanaRpc({ rpcUrl: SOLANA_RPC_URL }));

export type AppClient = typeof solanaClient;
