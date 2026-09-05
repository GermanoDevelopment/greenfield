import React from 'react';
import { useApp } from '../context/AppContext';
import SolanaAddressPill from '../components/atoms/SolanaAddressPill';
import UsdcBadge from '../components/atoms/UsdcBadge';
import { History, ExternalLink, ShieldCheck } from 'lucide-react';

export const PaymentHistoryPage: React.FC = () => {
  const { bounties, solanaService } = useApp();

  const claimedBounties = bounties.filter((b) => b.status === 'CLAIMED' && b.claim);

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-emerald-400" />
            <span>Histórico de Pagamentos On-Chain</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro imutável de todas as transações USDC liquidadas na rede Solana Devnet.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{claimedBounties.length} Transações Confirmadas</span>
        </div>
      </div>

      {claimedBounties.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-md">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="px-5 py-3.5">Issue & PR</th>
                <th className="px-5 py-3.5">Desenvolvedor</th>
                <th className="px-5 py-3.5">Valor Pago</th>
                <th className="px-5 py-3.5">Assinatura On-Chain</th>
                <th className="px-5 py-3.5">Data / Hora</th>
                <th className="px-5 py-3.5 text-right">Explorer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {claimedBounties.map((bounty) => {
                const claim = bounty.claim!;
                const explorerUrl = solanaService.getExplorerUrl(claim.transaction_signature);

                return (
                  <tr key={bounty.id} className="hover:bg-slate-800/30 transition-colors font-mono">
                    {/* Issue */}
                    <td className="px-5 py-4 font-sans">
                      <div className="font-semibold text-white text-xs">
                        #{bounty.issue?.number} {bounty.issue?.title}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {bounty.repository?.name} {bounty.pr && `(PR #${bounty.pr.number})`}
                      </span>
                    </td>

                    {/* Developer */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-slate-200">
                          @{bounty.developer?.github_username}
                        </span>
                        <SolanaAddressPill address={claim.wallet_address} showExplorerLink={false} />
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4">
                      <UsdcBadge amount={claim.usdc_amount} size="sm" />
                    </td>

                    {/* Signature */}
                    <td className="px-5 py-4 text-xs text-slate-400">
                      <span className="p-1.5 rounded bg-slate-950 border border-slate-800 text-[11px] block max-w-[140px] truncate" title={claim.transaction_signature}>
                        {claim.transaction_signature.slice(0, 8)}...{claim.transaction_signature.slice(-8)}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-slate-400 font-sans">
                      {new Date(claim.created_at).toLocaleDateString()} {new Date(claim.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Link */}
                    <td className="px-5 py-4 text-right">
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-950/60 hover:bg-purple-900/80 border border-purple-700/50 text-purple-300 text-xs transition-colors cursor-pointer"
                        title="Ver no Solana Explorer"
                      >
                        <span>Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 rounded-xl border border-slate-800 bg-slate-900/40 text-center text-slate-400">
          <p className="text-sm">Nenhum pagamento liquidado ainda.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryPage;
