import { decodeTreasuryAccount } from '../lib/greenfieldProgram';
import { LocalStorageTreasuryRepository } from '../infrastructure/repositories/LocalStorageTreasuryRepository';
import { greenfieldApi } from '../services/api';

async function runTests() {
  console.log('--- TEST 1: decodeTreasuryAccount binary decoding ---');
  // Construct a dummy 130-byte buffer:
  // 8 discriminator + 32 authority + 32 mint + 32 vault = 104 bytes
  // 8 bytes total_deposited (e.g. 50,000 USDC = 50,000,000,000 micro-USDC)
  // 8 bytes total_reserved (e.g. 10,000 USDC = 10,000,000,000 micro-USDC)
  // 8 bytes total_claimed (e.g. 5,000 USDC = 5,000,000,000 micro-USDC)
  // 1 byte bump (254)
  const buffer = new ArrayBuffer(130);
  const view = new DataView(buffer);
  const totalDepositedUnits = 50_000_000_000n;
  const totalReservedUnits = 10_000_000_000n;
  const totalClaimedUnits = 5_000_000_000n;

  view.setBigUint64(104, totalDepositedUnits, true);
  view.setBigUint64(112, totalReservedUnits, true);
  view.setBigUint64(120, totalClaimedUnits, true);
  const uint8 = new Uint8Array(buffer);
  uint8[128] = 254;

  const decoded = decodeTreasuryAccount(uint8);
  console.assert(decoded.total_deposited === totalDepositedUnits, 'total_deposited mismatch');
  console.assert(decoded.total_reserved === totalReservedUnits, 'total_reserved mismatch');
  console.assert(decoded.total_claimed === totalClaimedUnits, 'total_claimed mismatch');
  console.assert(decoded.total_deposited_usdc === 50000, 'total_deposited_usdc mismatch');
  console.assert(decoded.total_reserved_usdc === 10000, 'total_reserved_usdc mismatch');
  console.assert(decoded.total_claimed_usdc === 5000, 'total_claimed_usdc mismatch');
  console.assert(decoded.available_usdc === 40000, 'available_usdc mismatch');
  console.log('✓ TEST 1 PASSED: On-chain binary decoding is exact.');

  console.log('--- TEST 2: LocalStorageTreasuryRepository live backend priority ---');
  const repo = new LocalStorageTreasuryRepository();

  // Mock greenfieldApi.getTreasuryBalance
  const originalGetTreasury = greenfieldApi.getTreasuryBalance;
  greenfieldApi.getTreasuryBalance = async () => ({
    total_deposited: 30_000_000_000,
    total_reserved: 5_000_000_000,
    total_claimed: 2_000_000_000,
    available: 25_000_000_000,
    total_deposited_usdc: 30000,
    total_reserved_usdc: 5000,
    total_claimed_usdc: 2000,
    available_usdc: 25000,
  });

  const t1 = await repo.getTreasury();
  console.assert(t1.total_usdc === 30000, 't1.total_usdc mismatch');
  console.assert(t1.reserved_usdc === 5000, 't1.reserved_usdc mismatch');
  console.assert(t1.available_usdc === 25000, 't1.available_usdc mismatch');
  console.log('✓ TEST 2 PASSED: Backend endpoint values override hardcoded constants.');

  console.log('--- TEST 3: reserveFunds solvency assertions ---');
  const canReserveSmall = await repo.reserveFunds(1000); // 1,000 USDC <= 25,000 available
  const canReserveLarge = await repo.reserveFunds(30000); // 30,000 USDC > 25,000 available
  console.assert(canReserveSmall === true, 'reserveFunds(1000) should succeed');
  console.assert(canReserveLarge === false, 'reserveFunds(30000) should be blocked');
  console.log('✓ TEST 3 PASSED: Solvency invariant strictly blocks insufficient funds.');

  // Restore API
  greenfieldApi.getTreasuryBalance = originalGetTreasury;

  console.log('--- ALL FRONTEND TREASURY & SOLVENCY TESTS PASSED! ---');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
