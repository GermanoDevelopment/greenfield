/**
 * Currency conversion utilities for Greenfield.
 * 
 * Canonical invariant:
 * 100 points = $1 USDC = 1,000,000 micro-USDC
 */

export const POINTS_PER_USDC = 100;
export const MICRO_USDC_PER_USDC = 1_000_000;
export const MICRO_USDC_PER_POINT = 10_000;

/** Convert points to USDC dollars (e.g. 500 points -> 5.00 USDC) */
export function pointsToUsdc(points: number): number {
  return points / POINTS_PER_USDC;
}

/** Convert USDC dollars to points (e.g. 5.00 USDC -> 500 points) */
export function usdcToPoints(usdc: number): number {
  return Math.round(usdc * POINTS_PER_USDC);
}

/** Convert micro-USDC to USDC dollars (e.g. 5_000_000 micro-USDC -> 5.00 USDC) */
export function microUsdcToUsdc(micro: number): number {
  return micro / MICRO_USDC_PER_USDC;
}

/** Convert USDC dollars to micro-USDC (e.g. 5.00 USDC -> 5_000_000 micro-USDC) */
export function usdcToMicroUsdc(usdc: number): number {
  return Math.round(usdc * MICRO_USDC_PER_USDC);
}

/** Convert points to micro-USDC (e.g. 100 points -> 1_000_000 micro-USDC) */
export function pointsToMicroUsdc(points: number): number {
  return points * MICRO_USDC_PER_POINT;
}

/** Format USDC dollars nicely (e.g. 5 -> "$5.00 USDC") */
export function formatUsdc(amountUsdc: number): string {
  return `$${amountUsdc.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USDC`;
}

/** Format micro-USDC directly (e.g. 2_500_000 -> "$2.50 USDC") */
export function formatMicroUsdc(microUsdc: number): string {
  return formatUsdc(microUsdcToUsdc(microUsdc));
}
