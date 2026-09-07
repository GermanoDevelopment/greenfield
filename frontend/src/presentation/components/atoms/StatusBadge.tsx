import React from 'react';
import type { BountyStatus } from '../../../core/domain/types';
import { Loader2, GitPullRequest, Coins, CheckCheck, Clock, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: BountyStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs font-medium'
      : 'px-2.5 py-1 text-xs font-semibold';

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  switch (status) {
    case 'IN_PROGRESS':
    case 'ASSIGNED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300 ${sizeClasses}`}
        >
          <Loader2 className={`${iconSize} animate-spin text-amber-500`} />
          <span>In Progress</span>
        </span>
      );

    case 'PR_OPEN':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-300 ${sizeClasses}`}
        >
          <GitPullRequest className={`${iconSize} text-blue-500`} />
          <span>PR Open</span>
        </span>
      );

    case 'CLAIMABLE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-400 font-bold ${sizeClasses} shadow-sm`}
        >
          <Coins className={`${iconSize} text-emerald-600 animate-bounce`} />
          <span>Claimable</span>
        </span>
      );

    case 'CLAIMED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300 ${sizeClasses}`}
        >
          <CheckCheck className={`${iconSize} text-slate-500`} />
          <span>Pago</span>
        </span>
      );

    case 'CANCELLED':
    case 'CLAIM_FAILED':
    case 'VERIFICATION_FAILED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-300 ${sizeClasses}`}
        >
          <AlertCircle className={`${iconSize} text-rose-500`} />
          <span>{status === 'CANCELLED' ? 'Cancelado' : 'Falha'}</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}
        >
          <Clock className={iconSize} />
          <span>{status}</span>
        </span>
      );
  }
};

export default StatusBadge;
