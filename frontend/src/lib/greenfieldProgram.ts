import {
  address,
  getAddressEncoder,
  getProgramDerivedAddress,
  getU64Encoder,
  getUtf8Encoder,
  type Address,
  type Instruction,
} from '@solana/kit';
import { AccountRole } from '@solana/instructions';

/**
 * Hand-rolled client for the greenfield escrow program's `claim` instruction.
 *
 * There is no generated IDL/Codama client available (anchor's idl-build step
 * is broken in this toolchain — see contract/tests/integration/helpers/anchorIx.ts
 * for the equivalent TypeScript encoder used by the contract's own test suite,
 * and backend/app/services/solana_service.py for the Python twin). Account
 * layouts and instruction data below mirror Anchor's Borsh + sighash format
 * exactly, cross-checked against those two implementations.
 */

const metaEnv =
  typeof import.meta !== 'undefined' && (import.meta as any).env
    ? (import.meta as any).env
    : (typeof process !== 'undefined' && process.env) || {};

const PROGRAM_ID_ENV = metaEnv.VITE_SOLANA_PROGRAM_ID as string | undefined;
const USDC_MINT_ENV = metaEnv.VITE_SOLANA_USDC_MINT as string | undefined;

export const TOKEN_PROGRAM_ID = address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ASSOCIATED_TOKEN_PROGRAM_ID = address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const SYSTEM_PROGRAM_ID = address('11111111111111111111111111111111');

// Falls back to the devnet USDC mint the backend defaults to (see
// backend/app/core/config.py:usdc_mint_devnet) so the two stay in sync
// without extra configuration in the common case.
export const USDC_MINT = address(USDC_MINT_ENV || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

export class GreenfieldProgramNotConfiguredError extends Error {
  constructor() {
    super(
      'VITE_SOLANA_PROGRAM_ID não está configurado — defina-o no .env do frontend após o deploy do programa greenfield.',
    );
    this.name = 'GreenfieldProgramNotConfiguredError';
  }
}

export function getProgramId(): Address {
  if (!PROGRAM_ID_ENV) throw new GreenfieldProgramNotConfiguredError();
  return address(PROGRAM_ID_ENV);
}

const addressEncoder = getAddressEncoder();
const utf8Encoder = getUtf8Encoder();
const u64Encoder = getU64Encoder();

async function anchorDiscriminator(ixName: string): Promise<Uint8Array> {
  const bytes = utf8Encoder.encode(`global:${ixName}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return new Uint8Array(digest).subarray(0, 8);
}

export async function findTreasuryPda(programId: Address, mint: Address): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: programId,
    seeds: [utf8Encoder.encode('treasury'), addressEncoder.encode(mint)],
  });
  return pda;
}

export async function findVaultPda(programId: Address, treasury: Address): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: programId,
    seeds: [utf8Encoder.encode('vault'), addressEncoder.encode(treasury)],
  });
  return pda;
}

export async function findBountyPda(
  programId: Address,
  treasury: Address,
  bountyId: number,
): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: programId,
    seeds: [
      utf8Encoder.encode('bounty'),
      addressEncoder.encode(treasury),
      u64Encoder.encode(BigInt(bountyId)),
    ],
  });
  return pda;
}

export async function findAssociatedTokenAddress(
  owner: Address,
  mint: Address,
): Promise<Address> {
  const [pda] = await getProgramDerivedAddress({
    programAddress: ASSOCIATED_TOKEN_PROGRAM_ID,
    seeds: [
      addressEncoder.encode(owner),
      addressEncoder.encode(TOKEN_PROGRAM_ID),
      addressEncoder.encode(mint),
    ],
  });
  return pda;
}

export interface ClaimAccounts {
  developer: Address;
  treasury: Address;
  bounty: Address;
  vault: Address;
  mint: Address;
  developerTokenAccount: Address;
}

/** Derives every PDA/ATA the `claim` instruction needs for a given bounty. */
export async function resolveClaimAccounts(
  developer: Address,
  bountyId: number,
): Promise<ClaimAccounts> {
  const programId = getProgramId();
  const treasury = await findTreasuryPda(programId, USDC_MINT);
  const vault = await findVaultPda(programId, treasury);
  const bounty = await findBountyPda(programId, treasury, bountyId);
  const developerTokenAccount = await findAssociatedTokenAddress(developer, USDC_MINT);

  return { developer, treasury, bounty, vault, mint: USDC_MINT, developerTokenAccount };
}

/**
 * Builds the developer-signed `claim` instruction. Matches the account order
 * in the `Claim` struct in contract/programs/greenfield/src/lib.rs exactly —
 * Anchor serializes accounts in declaration order.
 */
export async function buildClaimInstruction(accounts: ClaimAccounts): Promise<Instruction> {
  const programId = getProgramId();
  const data = await anchorDiscriminator('claim');

  return {
    programAddress: programId,
    accounts: [
      { address: accounts.developer, role: AccountRole.WRITABLE_SIGNER },
      { address: accounts.treasury, role: AccountRole.WRITABLE },
      { address: accounts.bounty, role: AccountRole.WRITABLE },
      { address: accounts.vault, role: AccountRole.WRITABLE },
      { address: accounts.mint, role: AccountRole.READONLY },
      { address: accounts.developerTokenAccount, role: AccountRole.WRITABLE },
      { address: TOKEN_PROGRAM_ID, role: AccountRole.READONLY },
      { address: ASSOCIATED_TOKEN_PROGRAM_ID, role: AccountRole.READONLY },
      { address: SYSTEM_PROGRAM_ID, role: AccountRole.READONLY },
    ],
    data,
  };
}

/** Resolves the Treasury PDA address for the configured program and USDC mint. */
export async function getTreasuryPdaAddress(): Promise<Address> {
  const programId = getProgramId();
  return await findTreasuryPda(programId, USDC_MINT);
}

/** Resolves the community pool's vault token account PDA. */
export async function getVaultPdaAddress(): Promise<Address> {
  const programId = getProgramId();
  const treasury = await findTreasuryPda(programId, USDC_MINT);
  return await findVaultPda(programId, treasury);
}

export interface FundTreasuryAccounts {
  funder: Address;
  funderTokenAccount: Address;
  treasury: Address;
  vault: Address;
  mint: Address;
}

/** Derives the accounts needed for the fund_treasury instruction. */
export async function resolveFundTreasuryAccounts(
  funder: Address,
): Promise<FundTreasuryAccounts> {
  const programId = getProgramId();
  const treasury = await findTreasuryPda(programId, USDC_MINT);
  const vault = await findVaultPda(programId, treasury);
  const funderTokenAccount = await findAssociatedTokenAddress(funder, USDC_MINT);

  return { funder, funderTokenAccount, treasury, vault, mint: USDC_MINT };
}

/** Builds the Anchor fund_treasury instruction. */
export async function buildFundTreasuryInstruction(
  accounts: FundTreasuryAccounts,
  amountMicroUsdc: bigint,
): Promise<Instruction> {
  const programId = getProgramId();
  const discriminator = await anchorDiscriminator('fund_treasury');
  const amountBytes = u64Encoder.encode(amountMicroUsdc);
  const data = new Uint8Array(discriminator.length + amountBytes.length);
  data.set(discriminator, 0);
  data.set(amountBytes, discriminator.length);

  return {
    programAddress: programId,
    accounts: [
      { address: accounts.funder, role: AccountRole.WRITABLE_SIGNER },
      { address: accounts.funderTokenAccount, role: AccountRole.WRITABLE },
      { address: accounts.treasury, role: AccountRole.WRITABLE },
      { address: accounts.vault, role: AccountRole.WRITABLE },
      { address: accounts.mint, role: AccountRole.READONLY },
      { address: TOKEN_PROGRAM_ID, role: AccountRole.READONLY },
    ],
    data,
  };
}

export interface DecodedTreasury {
  total_deposited: bigint;
  total_reserved: bigint;
  total_claimed: bigint;
  bump: number;
  total_deposited_usdc: number;
  total_reserved_usdc: number;
  total_claimed_usdc: number;
  available_usdc: number;
}

/** Decodes Anchor Treasury account data buffer into domain numbers. */
export function decodeTreasuryAccount(data: Uint8Array): DecodedTreasury {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  // Skip 8-byte discriminator + 32-byte authority + 32-byte mint + 32-byte vault = 104 bytes
  const total_deposited = view.getBigUint64(104, true);
  const total_reserved = view.getBigUint64(112, true);
  const total_claimed = view.getBigUint64(120, true);
  const bump = data[128] ?? 0;

  const total_deposited_usdc = Number(total_deposited) / 1_000_000;
  const total_reserved_usdc = Number(total_reserved) / 1_000_000;
  const total_claimed_usdc = Number(total_claimed) / 1_000_000;
  const available_usdc = Math.max(0, total_deposited_usdc - total_reserved_usdc);

  return {
    total_deposited,
    total_reserved,
    total_claimed,
    bump,
    total_deposited_usdc,
    total_reserved_usdc,
    total_claimed_usdc,
    available_usdc,
  };
}

/** Fetches on-chain treasury account directly from Solana RPC. */
export async function fetchOnChainTreasury(rpcUrl?: string): Promise<DecodedTreasury | null> {
  try {
    const programId = getProgramId();
    const treasuryPda = await findTreasuryPda(programId, USDC_MINT);
    const endpoint =
      rpcUrl || (metaEnv.VITE_SOLANA_RPC_URL as string) || 'https://api.devnet.solana.com';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountInfo',
        params: [treasuryPda, { encoding: 'base64' }],
      }),
    });
    const json = await res.json();
    const base64Data = json?.result?.value?.data?.[0];
    if (!base64Data) return null;

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return decodeTreasuryAccount(bytes);
  } catch {
    return null;
  }
}

