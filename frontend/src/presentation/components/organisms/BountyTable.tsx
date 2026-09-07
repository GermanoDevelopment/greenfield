import React from 'react';
import { Link } from 'react-router-dom';
import type { Bounty } from '../../../core/domain/types';
import StatusBadge from '../atoms/StatusBadge';
import PointsBadge from '../atoms/PointsBadge';
import UsdcBadge from '../atoms/UsdcBadge';
import { GitPullRequest, ArrowRight, Sparkles, Inbox } from 'lucide-react';

interface BountyTableProps {
  bounties: Bounty[];
  onClaimClick?: (bounty: Bounty) => void;
  emptyMessage?: string;
  limit?: number;
}

export const BountyTable: React.FC<BountyTableProps> = ({
  bounties,
  onClaimClick,
  emptyMessage = 'Nenhuma bounty encontrada neste estado.',
  limit,
}) => {
  const displayedBounties = limit ? bounties.slice(0, limit) : bounties;

  if (displayedBounties.length === 0) {
    return (
      <div className="rounded-2xl border border-[#EEF2F6] bg-white p-12 text-center text-slate-500 shadow-card flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
          <Inbox className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {/* 1. VISUALIZAÇÃO MOBILE (< 600px): Cards Empilhados com botão de ação total */}
      <div className="flex flex-col gap-4 md:hidden">
        {displayedBounties.map((bounty) => {
          const isClaimable = bounty.status === 'CLAIMABLE';

          return (
            <div
              key={bounty.id}
              className="rounded-2xl border border-[#EEF2F6] bg-white p-4 shadow-card flex flex-col gap-3.5 interactive-card"
            >
              {/* Topo do Card: Issue e Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-blue-600 font-bold text-xs mt-0.5">
                    #{bounty.issue?.number || '—'}
                  </span>
                  <div>
                    <Link
                      to={`/bounties/${bounty.id}`}
                      className="font-semibold text-slate-900 text-sm hover:text-blue-600 transition-colors line-clamp-1"
                    >
                      {bounty.issue?.title || 'Bounty sem título'}
                    </Link>
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                      {bounty.repository?.owner}/{bounty.repository?.name}
                      {bounty.pr && (
                        <span className="text-purple-600 flex items-center gap-0.5 ml-1">
                          <GitPullRequest className="w-3 h-3" /> #{bounty.pr.number}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <StatusBadge status={bounty.status} size="sm" />
              </div>

              {/* Meio: Dev e Recompensa */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  {bounty.developer ? (
                    <div className="flex items-center gap-1.5">
                      <img
                        src={
                          bounty.developer.avatar_url ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'
                        }
                        alt={bounty.developer.github_username}
                        className="w-5 h-5 rounded-full border border-slate-200 object-cover"
                      />
                      <span className="font-mono text-slate-700 font-medium">
                        @{bounty.developer.github_username}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Disponível</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <PointsBadge points={bounty.points} size="sm" showIcon={false} />
                  <UsdcBadge amount={bounty.usdc_amount} size="sm" />
                </div>
              </div>

              {/* Botão de Ação: Largura Total e altura mínima 44px */}
              <div className="pt-1">
                {isClaimable && onClaimClick ? (
                  <button
                    onClick={() => onClaimClick(bounty)}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer interactive-btn"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Resgatar ${bounty.usdc_amount} USDC</span>
                  </button>
                ) : (
                  <Link
                    to={`/bounties/${bounty.id}`}
                    className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Ver Detalhes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. VISUALIZAÇÃO DESKTOP / TABLET (>= 600px): Tabela Clássica */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#EEF2F6] bg-white shadow-card">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-[#EEF2F6]">
            <tr>
              <th className="px-6 py-4">Issue & Repositório</th>
              <th className="px-6 py-4">Desenvolvedor</th>
              <th className="px-6 py-4">Recompensa</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF2F6]">
            {displayedBounties.map((bounty) => {
              const isClaimable = bounty.status === 'CLAIMABLE';

              return (
                <tr
                  key={bounty.id}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  {/* Issue */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2.5">
                      <span className="font-mono text-blue-600 font-bold text-xs mt-0.5">
                        #{bounty.issue?.number || '—'}
                      </span>
                      <div>
                        <Link
                          to={`/bounties/${bounty.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                        >
                          {bounty.issue?.title || 'Bounty sem título'}
                        </Link>
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          {bounty.repository?.owner}/{bounty.repository?.name}
                          {bounty.pr && (
                            <span className="text-purple-600 flex items-center gap-0.5 ml-1.5 font-medium">
                              <GitPullRequest className="w-3 h-3" /> PR #{bounty.pr.number}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Dev */}
                  <td className="px-6 py-4">
                    {bounty.developer ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={
                            bounty.developer.avatar_url ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'
                          }
                          alt={bounty.developer.github_username}
                          className="w-6 h-6 rounded-full border border-slate-200 object-cover"
                        />
                        <span className="text-xs font-mono text-slate-700 font-medium">
                          @{bounty.developer.github_username}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Disponível</span>
                    )}
                  </td>

                  {/* Reward */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <PointsBadge points={bounty.points} size="sm" />
                      <UsdcBadge amount={bounty.usdc_amount} size="sm" />
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <StatusBadge status={bounty.status} size="sm" />
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isClaimable && onClaimClick && (
                        <button
                          onClick={() => onClaimClick(bounty)}
                          className="px-3.5 py-2 min-h-[38px] rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-all cursor-pointer interactive-btn"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Resgatar ${bounty.usdc_amount}</span>
                        </button>
                      )}

                      <Link
                        to={`/bounties/${bounty.id}`}
                        className="px-3 py-2 min-h-[38px] rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <span>Ver Detalhes</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BountyTable;
