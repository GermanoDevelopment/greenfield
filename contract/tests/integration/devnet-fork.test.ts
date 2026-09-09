import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { Surfnet } from '@solana/surfpool';
import { BountyStatus, decodeBounty, decodeTreasury } from './helpers/anchorIx';
import { createGreenfieldClient, findTreasuryPda, findVaultPda } from './helpers/greenfieldClient';

/**
 * Simulates using the escrow contract "on devnet" without spending real
 * devnet SOL or waiting on faucet rate limits: Surfpool forks live devnet
 * (accounts are lazily cloned from api.devnet.solana.com on first access,
 * same as `surfpool start --network devnet`), our program is deployed into
 * that forked network, and the full bounty lifecycle runs against it.
 */

const PROGRAM_ID = new PublicKey('DFebMWgv4WEJgzodxnQwvXavUeFKXT3mPPMXtMrWyoRv');
const USDC_DECIMALS = 6;
const ONE_USDC = 1_000_000n;

// Circle's official devnet USDC mint — used only to prove the fork is really
// pulling live devnet state, not to fund the escrow (we mint our own test
// USDC below so the suite doesn't depend on a funded devnet faucet).
const DEVNET_USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

describe('greenfield escrow program — devnet fork simulation', () => {
  let surfnet: Surfnet;
  let connection: Connection;
  let authority: Keypair;
  let client: ReturnType<typeof createGreenfieldClient>;

  let mint: PublicKey;
  let treasury: PublicKey;
  let vault: PublicKey;

  beforeAll(async () => {
    surfnet = Surfnet.startWithConfig({
      offline: false,
      remoteRpcUrl: 'https://api.devnet.solana.com',
    });
    connection = new Connection(surfnet.rpcUrl, {
      commitment: 'confirmed',
      wsEndpoint: surfnet.wsUrl,
    });
    authority = Keypair.fromSecretKey(Uint8Array.from(surfnet.payerSecretKey));
    client = createGreenfieldClient(connection, PROGRAM_ID);

    surfnet.deployProgram('greenfield');

    mint = await createMint(connection, authority, authority.publicKey, null, USDC_DECIMALS);
    treasury = findTreasuryPda(PROGRAM_ID, mint);
    vault = findVaultPda(PROGRAM_ID, treasury);

    await client.initializeTreasury(authority, mint, treasury, vault);
  }, 60_000);

  afterAll(() => {
    surfnet.stop();
  });

  it('really is forking devnet — the well-known devnet USDC mint is lazily cloned', async () => {
    const devnetUsdc = await connection.getAccountInfo(DEVNET_USDC_MINT);
    expect(devnetUsdc).not.toBeNull();
    expect(devnetUsdc!.owner.equals(TOKEN_PROGRAM_ID)).toBe(true);
  });

  it('runs the full bounty lifecycle against the devnet fork', async () => {
    const funderAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      authority,
      mint,
      authority.publicKey,
    );
    await mintTo(connection, authority, mint, funderAccount.address, authority, 100n * ONE_USDC);
    await client.fundTreasury(authority, funderAccount.address, treasury, vault, mint, 10n * ONE_USDC);

    const maintainer = Keypair.generate().publicKey;
    const developer = Keypair.generate();
    surfnet.fundSol(developer.publicKey.toBase58(), 1_000_000_000);

    const amount = 3n * ONE_USDC;
    const bountyId = 1n;

    const bounty = await client.createBounty(authority, treasury, maintainer, bountyId, amount);
    await client.assignDeveloper(authority, treasury, bounty, developer.publicKey);
    await client.approveClaim(authority, treasury, bounty);

    const developerAta = await client.claim(developer, treasury, bounty, vault, mint);

    const bountyAccount = decodeBounty((await connection.getAccountInfo(bounty))!.data);
    expect(bountyAccount.status).toBe(BountyStatus.Claimed);

    const treasuryAccount = decodeTreasury((await connection.getAccountInfo(treasury))!.data);
    expect(treasuryAccount.totalClaimed).toBe(amount);

    const balance = await connection.getTokenAccountBalance(developerAta);
    expect(BigInt(balance.value.amount)).toBe(amount);
  }, 60_000);
});
