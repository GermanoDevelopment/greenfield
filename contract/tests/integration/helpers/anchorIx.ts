import { createHash } from 'node:crypto';
import { PublicKey } from '@solana/web3.js';

/**
 * The program has no generated IDL/Codama client available in this sandbox
 * (no `anchor` CLI to run `anchor build --idl`), so instruction data and
 * account layouts are (de)serialized by hand here, mirroring Anchor's
 * default Borsh + sighash encoding exactly.
 */

export function anchorDiscriminator(ixName: string): Buffer {
  return createHash('sha256').update(`global:${ixName}`).digest().subarray(0, 8);
}

export function u64LE(value: bigint | number): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value));
  return buf;
}

export function encodeInitializeTreasury(): Buffer {
  return anchorDiscriminator('initialize_treasury');
}

export function encodeFundTreasury(amount: bigint | number): Buffer {
  return Buffer.concat([anchorDiscriminator('fund_treasury'), u64LE(amount)]);
}

export function encodeCreateBounty(bountyId: bigint | number, amount: bigint | number): Buffer {
  return Buffer.concat([anchorDiscriminator('create_bounty'), u64LE(bountyId), u64LE(amount)]);
}

export function encodeAssignDeveloper(developer: PublicKey): Buffer {
  return Buffer.concat([anchorDiscriminator('assign_developer'), developer.toBuffer()]);
}

export function encodeApproveClaim(): Buffer {
  return anchorDiscriminator('approve_claim');
}

export function encodeClaim(): Buffer {
  return anchorDiscriminator('claim');
}

export function encodeCancelBounty(): Buffer {
  return anchorDiscriminator('cancel_bounty');
}

export const BountyStatus = {
  Open: 0,
  ReadyToClaim: 1,
  Claimed: 2,
  Cancelled: 3,
} as const;

export interface DecodedTreasury {
  authority: PublicKey;
  mint: PublicKey;
  vault: PublicKey;
  totalDeposited: bigint;
  totalReserved: bigint;
  totalClaimed: bigint;
  bump: number;
}

export function decodeTreasury(data: Buffer): DecodedTreasury {
  let offset = 8; // skip account discriminator
  const readPubkey = () => {
    const key = new PublicKey(data.subarray(offset, offset + 32));
    offset += 32;
    return key;
  };
  const readU64 = () => {
    const value = data.readBigUInt64LE(offset);
    offset += 8;
    return value;
  };

  const authority = readPubkey();
  const mint = readPubkey();
  const vault = readPubkey();
  const totalDeposited = readU64();
  const totalReserved = readU64();
  const totalClaimed = readU64();
  const bump = data.readUInt8(offset);

  return { authority, mint, vault, totalDeposited, totalReserved, totalClaimed, bump };
}

export interface DecodedBounty {
  treasury: PublicKey;
  bountyId: bigint;
  maintainer: PublicKey;
  developer: PublicKey | null;
  amount: bigint;
  status: number;
  bump: number;
}

export function decodeBounty(data: Buffer): DecodedBounty {
  let offset = 8; // skip account discriminator
  const readPubkey = () => {
    const key = new PublicKey(data.subarray(offset, offset + 32));
    offset += 32;
    return key;
  };
  const readU64 = () => {
    const value = data.readBigUInt64LE(offset);
    offset += 8;
    return value;
  };

  const treasury = readPubkey();
  const bountyId = readU64();
  const maintainer = readPubkey();

  const developerTag = data.readUInt8(offset);
  offset += 1;
  let developer: PublicKey | null = null;
  if (developerTag === 1) {
    developer = readPubkey();
  }

  const amount = readU64();
  const status = data.readUInt8(offset);
  offset += 1;
  const bump = data.readUInt8(offset);

  return { treasury, bountyId, maintainer, developer, amount, status, bump };
}
