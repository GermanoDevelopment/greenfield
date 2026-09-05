import React from 'react';
import { Link } from 'react-router-dom';
import type { Bounty } from '../../../core/domain/types';
import StatusBadge from '../atoms/StatusBadge';
import PointsBadge from '../atoms/PointsBadge';
import UsdcBadge from '../atoms/UsdcBadge';
import { GitPullRequest, ArrowRight, Sparkles } from 'lucide-react';

interface BountyTableProps {
  bounties: Bounty[];
  onClaimClick?: (bounty: Bounty) => void;
  emptyMessage?: string;
}

export const BountyTable: React.FC<BountyTableProps> = ({
  bounties,
  onClaimClick,
  emptyMessage = 'Nenhuma bounty encontrada neste estado.',
}) => {
  if (bounties.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-md">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
          <tr>
            <th className="px-5 py-3.5">Issue</th>
            <th className="px-5 py-3.5">Desenvolvedor</th>
            <th className="px-5 py-3.5">Recompensa</th>
            <th className="px-5 py-3.5">Status</th>
            <th className="px-5 py-3.5 text-right">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {bounties.map((bounty) => {
            const isClaimable = bounty.status === 'CLAIMABLE';

            return (
              <tr
                key={bounty.id}
                className="hover:bg-slate-800/40 transition-colors group"
              >
                {/* Issue info */}
                <td className="px-5 py-4">
                  <div className="flex items-start gap-2.5">
                    <span className="font-mono text-emerald-400 font-semibold text-xs mt-0.5">
                      #{bounty.issue?.number || '—'}
                    </span>
                    <div>
                      <Link
                        to={`/bounties/${bounty.id}`}
                        className="font-medium text-white hover:text-emerald-400 transition-colors line-clamp-1 group-hover:underline"
                      >
                        {bounty.issue?.title || 'Bounty sem título'}
                      </Link>
                      <span className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        {bounty.repository?.owner}/{bounty.repository?.name}
                        {bounty.pr && (
                          <span className="text-purple-400 flex items-center gap-0.5 ml-1.5">
                            <GitPullRequest className="w-3 h-3" /> PR #{bounty.pr.number}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Developer */}
                <td className="px-5 py-4">
                  {bounty.developer ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={bounty.developer.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                        alt={bounty.developer.github_username}
                        className="w-6 h-6 rounded-full border border-slate-700 object-cover"
                      />
                      <span className="text-xs font-mono text-slate-300">
                        @{bounty.developer.github_username}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Disponível</span>
                  )}
                </td>

                {/* Reward (Points + USDC) */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <PointsBadge points={bounty.points} size="sm" />
                    <UsdcBadge amount={bounty.usdc_amount} size="sm" />
                  </div>
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <StatusBadge status={bounty.status} size="sm" />
                </td>

                {/* Action */}
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {isClaimable && onClaimClick && (
                      <button
                        onClick={() => onClaimClick(bounty)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer animate-pulse"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        CLAIM ${bounty.usdc_amount}
                      </button>
                    )}

                    <Link
                      to={`/bounties/${bounty.id}`}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>Ver Detalhes</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BountyTable;
