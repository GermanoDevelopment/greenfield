import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import MetricCard from '../molecules/MetricCard';
import BountyTable from './BountyTable';
import ClaimModal from '../molecules/ClaimModal';
import { Award, Code2, Sparkles, DollarSign, ArrowRight } from 'lucide-react';
import type { Bounty } from '../../../core/domain/types';

export const DeveloperDashboard: React.FC = () => {
  const { bounties, currentUser } = useApp();
  const [selectedBountyForClaim, setSelectedBountyForClaim] = useState<Bounty | null>(null);

  // Bounties atribuídas ao desenvolvedor logado
  const devBounties = bounties.filter((b) => b.developer_id === currentUser.id);

  // 4 Cards de Métricas do Desenvolvedor
  const assignedCount = devBounties.length;
  const inProgressCount = devBounties.filter(
    (b) => b.status === 'IN_PROGRESS' || b.status === 'ASSIGNED' || b.status === 'PR_OPEN'
  ).length;
  const claimableBounties = devBounties.filter((b) => b.status === 'CLAIMABLE');
  const claimableCount = claimableBounties.length;
  const totalEarnedUsdc = devBounties
    .filter((b) => b.status === 'CLAIMED')
    .reduce((sum, b) => sum + b.usdc_amount, 0);

  // Recompensa pronta para claim em destaque
  const topClaimable = claimableBounties[0];

  return (
    <div className="flex flex-col gap-8">
      {/* 4 Cards de Métricas do Desenvolvedor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Bounties Atribuídas"
          value={assignedCount}
          subtext="Tarefas sob sua responsabilidade"
          icon={<Award className="w-5 h-5" />}
        />
        <MetricCard
          label="Em Desenvolvimento"
          value={inProgressCount}
          subtext="Issues abertas ou PR em review"
          icon={<Code2 className="w-5 h-5" />}
        />
        <MetricCard
          label="Pronto para Resgate"
          value={claimableCount}
          subtext="PRs mergeados prontos para saque"
          icon={<Sparkles className="w-5 h-5 text-emerald-600" />}
          variant={claimableCount > 0 ? 'highlight' : 'default'}
        />
        <MetricCard
          label="Total Recebido"
          value={`$${totalEarnedUsdc.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
          subtext="USDC recebido em sua carteira"
          icon={<DollarSign className="w-5 h-5 text-teal-600" />}
        />
      </div>

      {/* Destaque de Resgate quando houver bounty claimable */}
      {topClaimable ? (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-400 p-6 md:p-8 shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-600 text-white font-extrabold shadow-md">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-mono font-semibold mb-1">
                MERGE CONFIRMADO ON-CHAIN
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Recompensa Liberada para Resgate
              </h3>
              <p className="text-sm text-slate-600 mt-1 max-w-xl">
                O Pull Request da Issue #{topClaimable.issue?.number} foi mergeado pelo mantenedor.
                Sua recompensa de <strong>{topClaimable.points.toLocaleString()} pontos</strong> está pronta para ser convertida em USDC.
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedBountyForClaim(topClaimable)}
            className="w-full md:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-base font-bold tracking-tight shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-3 cursor-pointer shrink-0 interactive-btn"
          >
            <span>RESGATAR ${topClaimable.usdc_amount} USDC</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      ) : null}

      {/* Lista de Minhas Bounties */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Minhas Bounties em Aberto
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe o ciclo de cada contribuição até a liberação do claim.
          </p>
        </div>

        <BountyTable
          bounties={devBounties}
          onClaimClick={(b) => setSelectedBountyForClaim(b)}
          emptyMessage="Você não possui bounties atribuídas no momento. Solicite uma atribuição ao mantenedor ou visualize os detalhes."
        />
      </div>

      {/* Modal de Claim */}
      {selectedBountyForClaim && (
        <ClaimModal
          bounty={selectedBountyForClaim}
          onClose={() => setSelectedBountyForClaim(null)}
        />
      )}
    </div>
  );
};

export default DeveloperDashboard;
