import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import MetricCard from '../molecules/MetricCard';
import BountyTable from './BountyTable';
import TreasuryBanner from './TreasuryBanner';
import ClaimModal from '../molecules/ClaimModal';
import type { Bounty } from '../../../core/domain/types';
import { Landmark, GitPullRequest, Code2, Clock, CheckCircle, PlusCircle, Filter, ArrowRight } from 'lucide-react';
import DesygenButton from '../atoms/DesygenButton';

export const MaintainerDashboard: React.FC = () => {
  const { bounties, treasury } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedBountyForClaim, setSelectedBountyForClaim] = useState<Bounty | null>(null);

  // 5 Métricas do Mantenedor (Seção 6.1 e 9.1)
  const isTreasuryLow = treasury ? treasury.available_usdc < 1000 : false;
  const treasuryBalance = treasury ? `$${treasury.available_usdc.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '$0.00';
  const activeBounties = bounties.filter(
    (b) => b.status !== 'CLAIMED' && b.status !== 'CANCELLED'
  ).length;
  const inProgressBounties = bounties.filter(
    (b) => b.status === 'IN_PROGRESS' || b.status === 'ASSIGNED'
  ).length;
  const awaitingMergeBounties = bounties.filter((b) => b.status === 'PR_OPEN').length;
  const totalPaidUsdc = bounties
    .filter((b) => b.status === 'CLAIMED')
    .reduce((sum, b) => sum + b.usdc_amount, 0);

  const filteredBounties = bounties.filter((b) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'OPEN_FOR_PROPOSALS') return b.status === 'OPEN_FOR_PROPOSALS' || b.status === 'FUNDED';
    if (filterStatus === 'IN_PROGRESS') return b.status === 'IN_PROGRESS' || b.status === 'ASSIGNED';
    if (filterStatus === 'PR_OPEN') return b.status === 'PR_OPEN';
    if (filterStatus === 'CLAIMABLE') return b.status === 'CLAIMABLE';
    if (filterStatus === 'CLAIMED') return b.status === 'CLAIMED';
    return true;
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Banner de Solvência do Tesouro */}
      <TreasuryBanner />

      {/* 1. CARDS DE MÉTRICAS (KPI): 1 col mobile, 2 cols tablet, 5 cols desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Saldo Tesouro"
          value={treasuryBalance}
          subtext="Disponível para alocação"
          icon={<Landmark className="w-5 h-5" />}
          isAlert={isTreasuryLow}
        />
        <MetricCard
          label="Bounties Ativas"
          value={activeBounties}
          subtext="Fundadas ou em curso"
          icon={<GitPullRequest className="w-5 h-5" />}
        />
        <MetricCard
          label="Em Desenvolvimento"
          value={inProgressBounties}
          subtext="Desenvolvedor atuando"
          icon={<Code2 className="w-5 h-5" />}
        />
        <MetricCard
          label="Aguardando Merge"
          value={awaitingMergeBounties}
          subtext="PR aberto para revisão"
          icon={<Clock className="w-5 h-5" />}
        />
        <MetricCard
          label="Total Pago"
          value={`$${totalPaidUsdc.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
          subtext="Liquidados on-chain"
          icon={<CheckCircle className="w-5 h-5" />}
        />
      </div>

      {/* 2. TABELA ENXUTA COM AS ÚLTIMAS 5 MOVIMENTAÇÕES */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Últimas Recompensas
            </h2>
            <p className="text-xs text-[#889887] mt-0.5">
              Acompanhe as movimentações mais recentes e aprove merges para liberar pagamentos.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filtro por estado */}
            <div className="flex items-center gap-1.5 bg-[#182017] border border-[#252E24] shadow-sm rounded-xl px-3 py-2 text-xs text-[#D2DFD1]">
              <Filter className="w-3.5 h-3.5 text-[#889887]" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#182017] text-xs text-[#D2DFD1] font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-[#182017] text-[#D2DFD1]">Todos os Estados</option>
                <option value="OPEN_FOR_PROPOSALS" className="bg-[#182017] text-[#D2DFD1]">Propostas Abertas</option>
                <option value="IN_PROGRESS" className="bg-[#182017] text-[#D2DFD1]">Em Desenvolvimento</option>
                <option value="PR_OPEN" className="bg-[#182017] text-[#D2DFD1]">Aguardando Merge (PR Open)</option>
                <option value="CLAIMABLE" className="bg-[#182017] text-[#D2DFD1]">Pronto para Resgate</option>
                <option value="CLAIMED" className="bg-[#182017] text-[#D2DFD1]">Concluídos (Pago)</option>
              </select>
            </div>

            <Link to="/bounties/new">
              <DesygenButton variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
                Nova Bounty
              </DesygenButton>
            </Link>
          </div>
        </div>

        {/* Tabela com limite de 5 itens para manter o dashboard enxuto */}
        <BountyTable
          bounties={filteredBounties}
          limit={5}
          onClaimClick={(b) => setSelectedBountyForClaim(b)}
          emptyMessage="Nenhuma recompensa ativa encontrada com este filtro."
        />

        {/* Rodapé da seção: Link para o Histórico completo */}
        <div className="flex items-center justify-center pt-2">
          <Link
            to="/history"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#252E24] bg-[#182017] hover:bg-[#20291e] text-[#D2DFD1] font-semibold text-xs shadow-sm transition-colors interactive-btn"
          >
            <span>Ver todas as movimentações no Histórico Completo</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#889887]" />
          </Link>
        </div>
      </div>

      {/* Modal de Claim On-chain */}
      {selectedBountyForClaim && (
        <ClaimModal
          bounty={selectedBountyForClaim}
          onClose={() => setSelectedBountyForClaim(null)}
        />
      )}
    </div>
  );
};

export default MaintainerDashboard;
