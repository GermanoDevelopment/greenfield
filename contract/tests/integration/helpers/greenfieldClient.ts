import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import {
  encodeApproveClaim,
  encodeAssignDeveloper,
  encodeCancelBounty,
  encodeClaim,
  encodeCreateBounty,
  encodeFundTreasury,
  encodeInitializeTreasury,
} from './anchorIx';

export function findTreasuryPda(programId: PublicKey, mint: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from('treasury'), mint.toBuffer()], programId)[0];
}

export function findVaultPda(programId: PublicKey, treasury: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from('vault'), treasury.toBuffer()], programId)[0];
}

export function findBountyPda(programId: PublicKey, treasury: PublicKey, bountyId: bigint) {
  const idBuf = Buffer.alloc(8);
  idBuf.writeBigUInt64LE(bountyId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('bounty'), treasury.toBuffer(), idBuf],
    programId,
  )[0];
}

async function send(
  connection: Connection,
  ixs: TransactionInstruction[],
  feePayer: Keypair,
  signers: Keypair[],
) {
  const tx = new Transaction().add(...ixs);
  tx.feePayer = feePayer.publicKey;
  return sendAndConfirmTransaction(connection, tx, [feePayer, ...signers], {
    commitment: 'confirmed',
  });
}

/**
 * Thin, hand-rolled client for the greenfield escrow program (no generated
 * IDL/Codama client is available in this sandbox — see anchorIx.ts).
 * Bound to a connection + program id so it works unchanged whether that
 * connection points at an embedded Surfpool surfnet, Anchor's local
 * validator, or a Surfpool fork of real devnet.
 */
export function createGreenfieldClient(connection: Connection, programId: PublicKey) {
  return {
    async initializeTreasury(authority: Keypair, mint: PublicKey, treasury: PublicKey, vault: PublicKey) {
      await send(
        connection,
        [
          new TransactionInstruction({
            programId,
            keys: [
              { pubkey: authority.publicKey, isSigner: true, isWritable: true },
              { pubkey: mint, isSigner: false, isWritable: false },
              { pubkey: treasury, isSigner: false, isWritable: true },
              { pubkey: vault, isSigner: false, isWritable: true },
              { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
              { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
              { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            ],
            data: encodeInitializeTreasury(),
          }),
        ],
        authority,
        [],
      );
    },

    async fundTreasury(
      authority: Keypair,
      funderTokenAccount: PublicKey,
      treasury: PublicKey,
      vault: PublicKey,
      mint: PublicKey,
      amount: bigint,
    ) {
      await send(
        connection,
        [
          new TransactionInstruction({
            programId,
            keys: [
              { pubkey: authority.publicKey, isSigner: true, isWritable: true },
              { pubkey: funderTokenAccount, isSigner: false, isWritable: true },
              { pubkey: treasury, isSigner: false, isWritable: true },
              { pubkey: vault, isSigner: false, isWritable: true },
              { pubkey: mint, isSigner: false, isWritable: false },
              { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            ],
            data: encodeFundTreasury(amount),
          }),
        ],
        authority,
        [],
      );
    },

    async createBounty(
      authority: Keypair,
      treasury: PublicKey,
      maintainer: PublicKey,
      bountyId: bigint,
      amount: bigint,
    ) {
      const bounty = findBountyPda(programId, treasury, bountyId);
      await send(
        connection,
        [
          new TransactionInstruction({
            programId,
            keys: [
              { pubkey: authority.publicKey, isSigner: true, isWritable: true },
              { pubkey: maintainer, isSigner: false, isWritable: false },
              { pubkey: treasury, isSigner: false, isWritable: true },
              { pubkey: bounty, isSigner: false, isWritable: true },
              { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            ],
            data: encodeCreateBounty(bountyId, amount),
          }),
        ],
        authority,
        [],
      );
      return bounty;
    },

    async assignDeveloper(authority: Keypair, treasury: PublicKey, bounty: PublicKey, developer: PublicKey) {
      await send(
        connection,
        [
          new TransactionInstruction({
            programId,
            keys: [
              { pubkey: authority.publicKey, isSigner: true, isWritable: false },
              { pubkey: treasury, isSigner: false, isWritable: false },
              { pubkey: bounty, isSigner: false, isWritable: true },
            ],
            data: encodeAssignDeveloper(developer),
          }),
        ],
        authority,
        [],
      );
    },

    async approveClaim(authority: Keypair, treasury: PublicKey, bounty: PublicKey) {
      await send(
        connection,
        [
          new TransactionInstruction({
            programId,
            keys: [
              { pubkey: authority.publicKey, isSigner: true, isWritable: false },
              { pubkey: treasury, isSigner: false, isWritable: false },
              { pubkey: bounty, isSigner: false, isWritable: true },
            ],
            data: encodeApproveClaim(),
          }),
        ],
        authority,
        [],
      );
    },

    async claim(developer: Keypair, treasury: PublicKey, bounty: PublicKey, vault: PublicKey, mint: PublicKey) {
      const developerAta = getAssociatedTokenAddressSync(mint, developer.publicKey);
      await send(
        connection,
        [
          new TransactionInstruction({
            programId,
            keys: [
              { pubkey: developer.publicKey, isSigner: true, isWritable: true },
              { pubkey: treasury, isSigner: false, isWritable: true },
              { pubkey: bounty, isSigner: false, isWritable: true },
              { pubkey: vault, isSigner: false, isWritable: true },
              { pubkey: mint, isSigner: false, isWritable: false },
              { pubkey: developerAta, isSigner: false, isWritable: true },
              { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
              { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
              { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            ],
            data: encodeClaim(),
          }),
        ],
        developer,
        [developer],
      );
      return developerAta;
    },

    async cancelBounty(authority: Keypair, treasury: PublicKey, bounty: PublicKey) {
      await send(
        connection,
        [
          new TransactionInstruction({
            programId,
            keys: [
              { pubkey: authority.publicKey, isSigner: true, isWritable: false },
              { pubkey: treasury, isSigner: false, isWritable: true },
              { pubkey: bounty, isSigner: false, isWritable: true },
            ],
            data: encodeCancelBounty(),
          }),
        ],
        authority,
        [],
      );
    },
  };
}

export type GreenfieldClient = ReturnType<typeof createGreenfieldClient>;
