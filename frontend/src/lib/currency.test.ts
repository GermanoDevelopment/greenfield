import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  POINTS_PER_USDC,
  MICRO_USDC_PER_USDC,
  MICRO_USDC_PER_POINT,
  pointsToUsdc,
  usdcToPoints,
  microUsdcToUsdc,
  usdcToMicroUsdc,
  pointsToMicroUsdc,
  formatUsdc,
  formatMicroUsdc,
} from './currency.ts';

describe('currency conversion utilities', () => {
  it('enforces canonical constants', () => {
    assert.equal(POINTS_PER_USDC, 100);
    assert.equal(MICRO_USDC_PER_USDC, 1_000_000);
    assert.equal(MICRO_USDC_PER_POINT, 10_000);
  });

  it('converts points to USDC accurately (100 points = $1 USDC)', () => {
    assert.equal(pointsToUsdc(100), 1);
    assert.equal(pointsToUsdc(500), 5);
    assert.equal(pointsToUsdc(120), 1.2);
    assert.equal(pointsToUsdc(0), 0);
  });

  it('converts USDC to points accurately', () => {
    assert.equal(usdcToPoints(1), 100);
    assert.equal(usdcToPoints(5), 500);
    assert.equal(usdcToPoints(1.2), 120);
    assert.equal(usdcToPoints(0), 0);
  });

  it('converts micro-USDC to USDC dollars (1_000_000 micro = $1)', () => {
    assert.equal(microUsdcToUsdc(1_000_000), 1);
    assert.equal(microUsdcToUsdc(2_500_000), 2.5);
    assert.equal(microUsdcToUsdc(500_000), 0.5);
    assert.equal(microUsdcToUsdc(0), 0);
  });

  it('converts USDC dollars to micro-USDC', () => {
    assert.equal(usdcToMicroUsdc(1), 1_000_000);
    assert.equal(usdcToMicroUsdc(2.5), 2_500_000);
    assert.equal(usdcToMicroUsdc(0.5), 500_000);
  });

  it('converts points to micro-USDC (1 point = 10_000 micro-USDC)', () => {
    assert.equal(pointsToMicroUsdc(100), 1_000_000);
    assert.equal(pointsToMicroUsdc(120), 1_200_000);
    assert.equal(pointsToMicroUsdc(500), 5_000_000);
  });

  it('formats USDC amounts consistently', () => {
    assert.equal(formatUsdc(5), '$5.00 USDC');
    assert.equal(formatUsdc(2.5), '$2.50 USDC');
    assert.equal(formatUsdc(0), '$0.00 USDC');
  });

  it('formats raw backend micro-USDC amounts correctly', () => {
    assert.equal(formatMicroUsdc(2_500_000), '$2.50 USDC');
    assert.equal(formatMicroUsdc(1_000_000), '$1.00 USDC');
    assert.equal(formatMicroUsdc(120_000), '$0.12 USDC');
  });
});
