import React from 'react';
import type { BountyStatus } from '../../../core/domain/types';

interface StatusBadgeProps {
  status: BountyStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses =
    size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  const config: Record<
    BountyStatus,
    { label: string; bg: string; text: string; border: string; pulse?: boolean }
  > = {
    DRAFT: {
      label: 'Draft',
      bg: 'bg-slate-800',
      text: 'text-slate-400',
      border: 'border-slate-700',
    },
    FUNDED: {
      label: 'Funded',
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-400',
      border: 'border-emerald-700/50',
    },
    ASSIGNED: {
      label: 'Assigned',
      bg: 'bg-sky-950/60',
      text: 'text-sky-400',
      border: 'border-sky-700/50',
    },
    IN_PROGRESS: {
      label: 'In Progress',
      bg: 'bg-amber-950/60',
      text: 'text-amber-400',
      border: 'border-amber-700/50',
    },
    PR_OPEN: {
      label: 'PR Open',
      bg: 'bg-purple-950/60',
      text: 'text-purple-400',
      border: 'border-purple-700/50',
    },
    MERGED: {
      label: 'Merged',
      bg: 'bg-indigo-950/60',
      text: 'text-indigo-400',
      border: 'border-indigo-700/50',
    },
    CLAIMABLE: {
      label: 'Claimable',
      bg: 'bg-emerald-900/60',
      text: 'text-emerald-300',
      border: 'border-emerald-500',
      pulse: true,
    },
    CLAIMED: {
      label: 'Claimed',
      bg: 'bg-teal-950/80',
      text: 'text-teal-400',
      border: 'border-teal-700/60',
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-rose-950/60',
      text: 'text-rose-400',
      border: 'border-rose-700/50',
    },
    EXPIRED: {
      label: 'Expired',
      bg: 'bg-slate-900',
      text: 'text-slate-500',
      border: 'border-slate-800',
    },
    VERIFICATION_FAILED: {
      label: 'Verification Failed',
      bg: 'bg-rose-950/60',
      text: 'text-rose-400',
      border: 'border-rose-700/50',
    },
    CLAIM_FAILED: {
      label: 'Claim Failed',
      bg: 'bg-rose-950/60',
      text: 'text-rose-400',
      border: 'border-rose-700/50',
    },
  };

  const current = config[status] || {
    label: status,
    bg: 'bg-slate-800',
    text: 'text-slate-300',
    border: 'border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses} transition-all`}
    >
      {current.pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      )}
      {current.label}
    </span>
  );
};

export default StatusBadge;
