/**
 * USDC conversion utilities.
 *
 * The backend stores micro-USDC (1 USDC = 1_000_000 micro-USDC).
 * Points are also in micro-USDC: 100 points = 1 USDC, so 1 point = 10_000 micro-USDC.
 */

/** Micro-USDC per USDC (1e6). */
export const MICRO_USDC_PER_USDC = 1_000_000;

/** Points per USDC (100). */
export const POINTS_PER_USDC = 100;

/** Convert micro-USDC to USDC. */
export function microUsdcToUsdc(microUsdc: number): number {
  return microUsdc / MICRO_USDC_PER_USDC;
}

/** Convert points to USDC. 100 points = 1 USDC. */
export function pointsToUsdc(points: number): number {
  return points / POINTS_PER_USDC;
}

/** Format micro-USDC as a USDC string for display. */
export function formatUsdc(microUsdc: number): string {
  return microUsdcToUsdc(microUsdc).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Format points as a USDC string for display. */
export function formatPointsAsUsdc(points: number): string {
  return pointsToUsdc(points).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
