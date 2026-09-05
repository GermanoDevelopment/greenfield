import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import BountyTable from '../components/organisms/BountyTable';
import ClaimModal from '../components/organisms/ClaimModal';
import { Award } from 'lucide-react';
import type { Bounty } from '../../core/domain/types';

export const MyContributionsPage: React.FC = () => {
  const { bounties, currentUser } = useApp();
  const [filter, setFilter] = useState<'ALL' | 'IN_PROGRESS' | 'CLAIMABLE' | 'CLAIMED'>('ALL');
  const [claimBounty, setClaimBounty] = useState<Bounty | null>(null);

  const myBounties = bounties.filter((b) => b.developer_id === currentUser.id);

  const filtered = myBounties.filter((b) => {
    if (filter === 'ALL') return true;
    if (filter === 'IN_PROGRESS') return b.status === 'IN_PROGRESS' || b.status === 'ASSIGNED' || b.status === 'PR_OPEN';
    if (filter === 'CLAIMABLE') return b.status === 'CLAIMABLE';
    if (filter === 'CLAIMED') return b.status === 'CLAIMED';
    return true;
  });

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-emerald-400" />
            <span>Minhas Contribuições</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visualização focada nas bounties atribuídas ao usuário ativo (@{currentUser.github_username}).
          </p>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          {(['ALL', 'IN_PROGRESS', 'CLAIMABLE', 'CLAIMED'] as const).map((tab) => {
            const labels = {
              ALL: 'Todas',
              IN_PROGRESS: 'Em Curso',
              CLAIMABLE: 'Claimable',
              CLAIMED: 'Concluídas',
            };
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  filter === tab
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      <BountyTable
        bounties={filtered}
        onClaimClick={(b) => setClaimBounty(b)}
        emptyMessage="Nenhuma contribuição encontrada para o filtro selecionado."
      />

      {claimBounty && (
        <ClaimModal bounty={claimBounty} onClose={() => setClaimBounty(null)} />
      )}
    </div>
  );
};

export default MyContributionsPage;
