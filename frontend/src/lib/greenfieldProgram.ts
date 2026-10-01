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

const PROGRAM_ID_ENV = import.meta.env.VITE_SOLANA_PROGRAM_ID as string | undefined;
const USDC_MINT_ENV = import.meta.env.VITE_SOLANA_USDC_MINT as string | undefined;

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
