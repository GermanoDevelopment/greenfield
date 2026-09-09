import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { Surfnet } from '@solana/surfpool';
import { BountyStatus, decodeBounty, decodeTreasury } from './helpers/anchorIx';
import { createGreenfieldClient, findTreasuryPda, findVaultPda } from './helpers/greenfieldClient';

const PROGRAM_ID = new PublicKey('DFebMWgv4WEJgzodxnQwvXavUeFKXT3mPPMXtMrWyoRv');
const USDC_DECIMALS = 6;
const ONE_USDC = 1_000_000n;

interface TestNetwork {
  connection: Connection;
  authority: Keypair;
  fundSol(pubkey: PublicKey, lamports: number): Promise<void>;
  teardown(): void;
}

/**
 * `anchor test` starts its own `solana-test-validator`, deploys the program
 * to it, and exports `ANCHOR_PROVIDER_URL`/`ANCHOR_WALLET` to this script —
 * attach to that instead of booting a second network. Running `npm test`
 * directly (outside Anchor) falls back to an embedded Surfpool surfnet,
 * which deploys the program itself.
 */
async function setupNetwork(): Promise<TestNetwork> {
  const providerUrl = process.env.ANCHOR_PROVIDER_URL;

  if (providerUrl) {
    const connection = new Connection(providerUrl, 'confirmed');
    const walletPath = process.env.ANCHOR_WALLET ?? '~/.config/solana/id.json';
    const secretKey = Uint8Array.from(
      JSON.parse(readFileSync(walletPath.replace(/^~/, process.env.HOME ?? '~'), 'utf-8')),
    );
    const authority = Keypair.fromSecretKey(secretKey);

    return {
      connection,
      authority,
      async fundSol(pubkey, lamports) {
        const signature = await connection.requestAirdrop(pubkey, lamports);
        await connection.confirmTransaction(signature, 'confirmed');
      },
      teardown() {},
    };
  }

  const surfnet = Surfnet.start();
  const connection = new Connection(surfnet.rpcUrl, {
    commitment: 'confirmed',
    wsEndpoint: surfnet.wsUrl,
  });
  const authority = Keypair.fromSecretKey(Uint8Array.from(surfnet.payerSecretKey));

  // Deploys target/deploy/greenfield.so at the declared program id,
  // discovered from Anchor.toml — no manual keypair wiring needed.
  surfnet.deployProgram('greenfield');

  return {
    connection,
    authority,
    async fundSol(pubkey, lamports) {
      surfnet.fundSol(pubkey.toBase58(), lamports);
    },
    teardown() {
      surfnet.stop();
    },
  };
}

describe('greenfield escrow program', () => {
  let network: TestNetwork;
  let connection: Connection;
  let client: ReturnType<typeof createGreenfieldClient>;

  let authority: Keypair; // backend-controlled treasury authority
  let mint: PublicKey;
  let treasury: PublicKey;
  let vault: PublicKey;
  let authorityFunderAta: PublicKey;

  let bountyIdCounter = 1n;
  const nextBountyId = () => bountyIdCounter++;

  beforeAll(async () => {
    network = await setupNetwork();
    connection = network.connection;
    authority = network.authority;
    client = createGreenfieldClient(connection, PROGRAM_ID);

    mint = await createMint(connection, authority, authority.publicKey, null, USDC_DECIMALS);

    treasury = findTreasuryPda(PROGRAM_ID, mint);
    vault = findVaultPda(PROGRAM_ID, treasury);

    await client.initializeTreasury(authority, mint, treasury, vault);

    const funderAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      authority,
      mint,
      authority.publicKey,
    );
    authorityFunderAta = funderAccount.address;

    await mintTo(connection, authority, mint, authorityFunderAta, authority, 100n * ONE_USDC);
  });

  afterAll(() => {
    network.teardown();
  });

  const fundTreasury = (amount: bigint) =>
    client.fundTreasury(authority, authorityFunderAta, treasury, vault, mint, amount);

  const createBounty = (bountyId: bigint, amount: bigint, maintainer: PublicKey) =>
    client.createBounty(authority, treasury, maintainer, bountyId, amount);

  const assignDeveloper = (bounty: PublicKey, developer: PublicKey) =>
    client.assignDeveloper(authority, treasury, bounty, developer);

  const approveClaim = (bounty: PublicKey) => client.approveClaim(authority, treasury, bounty);

  const claim = (bounty: PublicKey, developer: Keypair) =>
    client.claim(developer, treasury, bounty, vault, mint);

  const cancelBounty = (bounty: PublicKey) => client.cancelBounty(authority, treasury, bounty);

  async function newFundedDeveloper() {
    const developer = Keypair.generate();
    await network.fundSol(developer.publicKey, 1_000_000_000);
    return developer;
  }

  it('pays the developer end-to-end once the maintainer approves the merge', async () => {
    await fundTreasury(10n * ONE_USDC);

    const bountyId = nextBountyId();
    const maintainer = Keypair.generate().publicKey;
    const developer = await newFundedDeveloper();
    const amount = 2n * ONE_USDC;

    const bounty = await createBounty(bountyId, amount, maintainer);
    await assignDeveloper(bounty, developer.publicKey);
    await approveClaim(bounty);

    const treasuryBefore = decodeTreasury(
      (await connection.getAccountInfo(treasury))!.data,
    );

    const developerAta = await claim(bounty, developer);

    const bountyAccount = decodeBounty((await connection.getAccountInfo(bounty))!.data);
    expect(bountyAccount.status).toBe(BountyStatus.Claimed);
    expect(bountyAccount.developer?.equals(developer.publicKey)).toBe(true);

    const treasuryAfter = decodeTreasury((await connection.getAccountInfo(treasury))!.data);
    expect(treasuryAfter.totalReserved).toBe(treasuryBefore.totalReserved - amount);
    expect(treasuryAfter.totalClaimed).toBe(treasuryBefore.totalClaimed + amount);

    const balance = await connection.getTokenAccountBalance(developerAta);
    expect(BigInt(balance.value.amount)).toBe(amount);
  });

  it('prevents double-claim once a bounty is already paid out', async () => {
    await fundTreasury(5n * ONE_USDC);

    const bountyId = nextBountyId();
    const maintainer = Keypair.generate().publicKey;
    const developer = await newFundedDeveloper();

    const bounty = await createBounty(bountyId, ONE_USDC, maintainer);
    await assignDeveloper(bounty, developer.publicKey);
    await approveClaim(bounty);
    await claim(bounty, developer);

    await expect(claim(bounty, developer)).rejects.toThrow();
  });

  it('rejects a claim before the backend approves the merge', async () => {
    await fundTreasury(5n * ONE_USDC);

    const bountyId = nextBountyId();
    const maintainer = Keypair.generate().publicKey;
    const developer = await newFundedDeveloper();

    const bounty = await createBounty(bountyId, ONE_USDC, maintainer);
    await assignDeveloper(bounty, developer.publicKey);

    // approve_claim was never called — status is still Open.
    await expect(claim(bounty, developer)).rejects.toThrow();
  });

  it('rejects a claim signed by a wallet other than the assigned developer', async () => {
    await fundTreasury(5n * ONE_USDC);

    const bountyId = nextBountyId();
    const maintainer = Keypair.generate().publicKey;
    const developer = await newFundedDeveloper();
    const impostor = await newFundedDeveloper();

    const bounty = await createBounty(bountyId, ONE_USDC, maintainer);
    await assignDeveloper(bounty, developer.publicKey);
    await approveClaim(bounty);

    await expect(claim(bounty, impostor)).rejects.toThrow();
  });

  it('keeps the treasury solvent — refuses to reserve more than is available', async () => {
    const treasuryBefore = decodeTreasury((await connection.getAccountInfo(treasury))!.data);
    const available = treasuryBefore.totalDeposited - treasuryBefore.totalReserved;

    const bountyId = nextBountyId();
    const maintainer = Keypair.generate().publicKey;

    await expect(createBounty(bountyId, available + ONE_USDC, maintainer)).rejects.toThrow();
  });

  it('releases the reservation back to the pool when a bounty is cancelled', async () => {
    const treasuryBefore = decodeTreasury((await connection.getAccountInfo(treasury))!.data);

    const bountyId = nextBountyId();
    const maintainer = Keypair.generate().publicKey;
    const developer = await newFundedDeveloper();
    const amount = ONE_USDC;

    const bounty = await createBounty(bountyId, amount, maintainer);
    await assignDeveloper(bounty, developer.publicKey);

    await cancelBounty(bounty);

    const treasuryAfter = decodeTreasury((await connection.getAccountInfo(treasury))!.data);
    expect(treasuryAfter.totalReserved).toBe(treasuryBefore.totalReserved);

    const bountyAccount = decodeBounty((await connection.getAccountInfo(bounty))!.data);
    expect(bountyAccount.status).toBe(BountyStatus.Cancelled);

    // A cancelled bounty can never be claimed afterwards.
    await expect(claim(bounty, developer)).rejects.toThrow();
  });
});
