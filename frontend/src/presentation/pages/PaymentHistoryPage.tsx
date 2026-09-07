import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import SolanaAddressPill from '../components/atoms/SolanaAddressPill';
import UsdcBadge from '../components/atoms/UsdcBadge';
import StatusBadge from '../components/atoms/StatusBadge';
import { History, ExternalLink, ShieldCheck, Lock, Filter, GitPullRequest, Search } from 'lucide-react';

export const PaymentHistoryPage: React.FC = () => {
  const { bounties, solanaService } = useApp();
  const [filterType, setFilterType] = useState<string>('ALL'); // ALL, CLAIMED, CANCELLED, OPEN
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtragem conforme a Seção 9.3 ("Todos", "Pagos", "Cancelados", "Em aberto")
  const filteredBounties = bounties.filter((b) => {
    // Filtro por tipo/status
    if (filterType === 'CLAIMED' && b.status !== 'CLAIMED') return false;
    if (filterType === 'CANCELLED' && b.status !== 'CANCELLED') return false;
    if (filterType === 'OPEN' && (b.status === 'CLAIMED' || b.status === 'CANCELLED')) return false;

    // Filtro por busca textual
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const issueTitle = b.issue?.title?.toLowerCase() || '';
      const repoName = b.repository?.name?.toLowerCase() || '';
      const devName = b.developer?.github_username?.toLowerCase() || '';
      const signature = b.claim?.transaction_signature?.toLowerCase() || '';
      return (
        issueTitle.includes(q) ||
        repoName.includes(q) ||
        devName.includes(q) ||
        signature.includes(q)
      );
    }

    return true;
  });

  const claimedCount = bounties.filter((b) => b.status === 'CLAIMED' && b.claim).length;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Cabeçalho do Histórico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-blue-600" />
            <span>Histórico de Pagamentos On-Chain</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registro imutável e transparente de transações e recompensas liquidadas na rede Solana Devnet.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono font-medium self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>{claimedCount} Liquidados On-Chain</span>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por issue, dev, repo ou hash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-sm min-h-[44px]"
          />
        </div>

        {/* Dropdown de Filtros (Todos, Pagos, Cancelados, Em aberto) */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-sm self-start sm:self-auto min-h-[44px]">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-transparent text-xs text-slate-800 font-bold focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todos os Registros</option>
            <option value="CLAIMED">Pagos (On-chain)</option>
            <option value="OPEN">Em Aberto / Em Andamento</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Listagem Híbrida: Mobile Cards (< 600px) / Desktop Tabela (>= 600px) */}
      {filteredBounties.length > 0 ? (
        <div>
          {/* 1. VISÃO MOBILE (< 600px): Cards Empilhados */}
          <div className="flex flex-col gap-3.5 md:hidden">
            {filteredBounties.map((bounty) => {
              const claim = bounty.claim;
              const explorerUrl = claim ? solanaService.getExplorerUrl(claim.transaction_signature) : null;

              return (
                <div
                  key={bounty.id}
                  className="rounded-2xl border border-[#EEF2F6] bg-white p-4 shadow-card flex flex-col gap-3 interactive-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-blue-600 font-bold text-xs">
                        #{bounty.issue?.number}
                      </span>
                      <h4 className="font-semibold text-slate-900 text-sm line-clamp-1 mt-0.5">
                        {bounty.issue?.title}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {bounty.repository?.name}
                      </span>
                    </div>

                    <StatusBadge status={bounty.status} size="sm" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500">Desenvolvedor:</span>
                    <span className="font-semibold text-slate-800">
                      {bounty.developer ? `@${bounty.developer.github_username}` : 'Não atribuído'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Valor da Recompensa:</span>
                    <UsdcBadge amount={bounty.usdc_amount} size="sm" />
                  </div>

                  {claim && (
                    <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 text-[11px] font-mono flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-purple-700">
                        <Lock className="w-3.5 h-3.5 text-purple-600" />
                        <span>
                          {claim.transaction_signature.slice(0, 6)}...{claim.transaction_signature.slice(-6)}
                        </span>
                      </div>
                      {explorerUrl && (
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-purple-700 font-bold hover:underline"
                        >
                          Explorer <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 2. VISÃO DESKTOP (>= 600px): Tabela Clássica */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#EEF2F6] bg-white shadow-card">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-[#EEF2F6]">
                <tr>
                  <th className="px-6 py-4">Issue & Repositório</th>
                  <th className="px-6 py-4">Desenvolvedor</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Assinatura On-Chain</th>
                  <th className="px-6 py-4">Status / Data</th>
                  <th className="px-6 py-4 text-right">Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F6]">
                {filteredBounties.map((bounty) => {
                  const claim = bounty.claim;
                  const explorerUrl = claim ? solanaService.getExplorerUrl(claim.transaction_signature) : null;

                  return (
                    <tr key={bounty.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Issue */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 text-xs">
                          #{bounty.issue?.number} {bounty.issue?.title}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          {bounty.repository?.name}
                          {bounty.pr && (
                            <span className="text-purple-600 flex items-center gap-0.5 ml-1">
                              <GitPullRequest className="w-3 h-3" /> PR #{bounty.pr.number}
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Developer */}
                      <td className="px-6 py-4">
                        {bounty.developer ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-slate-800">
                              @{bounty.developer.github_username}
                            </span>
                            <SolanaAddressPill address={bounty.developer.wallet_address} showExplorerLink={false} />
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Disponível</span>
                        )}
                      </td>

                      {/* Valor */}
                      <td className="px-6 py-4">
                        <UsdcBadge amount={bounty.usdc_amount} size="sm" />
                      </td>

                      {/* Assinatura com Selo/Cadeado de Imutabilidade */}
                      <td className="px-6 py-4">
                        {claim ? (
                          <div
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono font-medium shadow-xs"
                            title={`Assinatura: ${claim.transaction_signature}`}
                          >
                            <Lock className="w-3.5 h-3.5 text-purple-600" />
                            <span>
                              {claim.transaction_signature.slice(0, 6)}...{claim.transaction_signature.slice(-6)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">—</span>
                        )}
                      </td>

                      {/* Status & Data */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <StatusBadge status={bounty.status} size="sm" />
                          <span className="text-[11px] text-slate-400">
                            {claim ? new Date(claim.created_at).toLocaleDateString() : new Date(bounty.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      {/* Link Explorer */}
                      <td className="px-6 py-4 text-right">
                        {explorerUrl ? (
                          <a
                            href={explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-semibold transition-colors cursor-pointer"
                            title="Ver transação imutável no Solana Explorer"
                          >
                            <span>Explorer</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl border border-[#EEF2F6] bg-white text-center text-slate-500 shadow-card">
          <p className="text-sm font-medium">Nenhum pagamento ou bounty encontrado com esses critérios.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryPage;
