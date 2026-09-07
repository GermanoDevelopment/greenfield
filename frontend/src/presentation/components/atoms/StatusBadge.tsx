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
    case 'OPEN_FOR_PROPOSALS':
    case 'FUNDED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-violet-950/40 text-violet-300 border border-violet-800/60 font-medium ${sizeClasses}`}
        >
          <Clock className={`${iconSize} text-violet-400`} />
          <span>Propostas Abertas</span>
        </span>
      );

    case 'IN_PROGRESS':
    case 'ASSIGNED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-950/40 text-amber-300 border border-amber-800/60 ${sizeClasses}`}
        >
          <Loader2 className={`${iconSize} animate-spin text-amber-400`} />
          <span>{status === 'ASSIGNED' ? 'Atribuído' : 'In Progress'}</span>
        </span>
      );

    case 'PR_OPEN':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-sky-950/40 text-sky-300 border border-sky-800/60 ${sizeClasses}`}
        >
          <GitPullRequest className={`${iconSize} text-sky-400`} />
          <span>PR Open</span>
        </span>
      );

    case 'CLAIMABLE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-[#28B110]/20 text-[#28B110] border border-[#28B110]/40 font-bold ${sizeClasses} shadow-sm`}
        >
          <Coins className={`${iconSize} text-[#28B110] animate-bounce`} />
          <span>Claimable</span>
        </span>
      );

    case 'CLAIMED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-[#131A12] text-[#889887] border border-[#252E24] ${sizeClasses}`}
        >
          <CheckCheck className={`${iconSize} text-[#28B110]`} />
          <span>Pago</span>
        </span>
      );

    case 'CANCELLED':
    case 'CLAIM_FAILED':
    case 'VERIFICATION_FAILED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-950/40 text-rose-300 border border-rose-800/60 ${sizeClasses}`}
        >
          <AlertCircle className={`${iconSize} text-rose-400`} />
          <span>{status === 'CANCELLED' ? 'Cancelado' : 'Falha'}</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-[#131A12] text-[#889887] border border-[#252E24] ${sizeClasses}`}
        >
          <Clock className={iconSize} />
          <span>{status}</span>
        </span>
      );
  }
};

export default StatusBadge;
