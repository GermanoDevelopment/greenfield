import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import MetricCard from '../molecules/MetricCard';
import BountyTable from './BountyTable';
import TreasuryBanner from './TreasuryBanner';
import { Landmark, GitPullRequest, Code2, Clock, CheckCircle, PlusCircle, Filter } from 'lucide-react';
import DesygenButton from '../atoms/DesygenButton';

export const MaintainerDashboard: React.FC = () => {
  const { bounties, treasury } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Cálculo das 5 métricas descritas na Seção 12
  const treasuryBalance = treasury ? `$${treasury.available_usdc.toLocaleString()}` : '$0.00';
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

      {/* 5 Cards de Métricas do Mantenedor (Seção 12) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Saldo do Tesouro"
          value={treasuryBalance}
          subtext="Disponível para alocação"
          icon={<Landmark className="w-5 h-5" />}
          variant="highlight"
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
          subtext="PR aberto pronto para revisão"
          icon={<Clock className="w-5 h-5 text-purple-400" />}
        />
        <MetricCard
          label="Total Pago"
          value={`$${totalPaidUsdc.toLocaleString()}`}
          subtext="Liquidados on-chain"
          icon={<CheckCircle className="w-5 h-5 text-teal-400" />}
        />
      </div>

      {/* Header da Seção de Bounties com Botão de Criação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Gerenciamento de Recompensas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Acompanhe o estado de cada issue e confirme merges para liberar pagamentos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro por estado */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">Todos os Estados</option>
              <option value="IN_PROGRESS" className="bg-slate-900">Em Desenvolvimento</option>
              <option value="PR_OPEN" className="bg-slate-900">Aguardando Merge (PR Open)</option>
              <option value="CLAIMABLE" className="bg-slate-900">Pronto para Claim</option>
              <option value="CLAIMED" className="bg-slate-900">Concluídos (Claimed)</option>
            </select>
          </div>

          <Link to="/bounties/new">
            <DesygenButton variant="primary" size="sm" icon={<PlusCircle className="w-4 h-4" />}>
              Criar Bounty
            </DesygenButton>
          </Link>
        </div>
      </div>

      {/* Tabela de Bounties */}
      <BountyTable bounties={filteredBounties} />
    </div>
  );
};

export default MaintainerDashboard;
