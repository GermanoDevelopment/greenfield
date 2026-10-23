/**
 * Centralized Role utilities and normalization for Greenfield MVP
 * Aligns frontend comparisons with API role values (MAINTAINER, CONTRIBUTOR, ADMIN).
 */

export function normalizeRole(role?: string | null): string {
  if (!role) return '';
  return role.trim().toUpperCase();
}

export function isMaintainerRole(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'MAINTAINER' || normalized === 'BOTH';
}

export function isDeveloperRole(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'CONTRIBUTOR' || normalized === 'DEVELOPER' || normalized === 'BOTH';
}

export function isAdminRole(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'ADMIN';
}
