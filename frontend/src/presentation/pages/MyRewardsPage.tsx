import React, { useState, useEffect } from 'react';
import {
  Coins,
  Award,
  ExternalLink,
  Copy,
  CheckCircle2,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { greenfieldApi, type ApiBountyOut } from '../../services/api';

export const MyRewardsPage: React.FC = () => {
  const { currentUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<ApiBountyOut[]>([]);
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  useEffect(() => {
    async function loadRewards() {
      setLoading(true);
      try {
        const allBounties = await greenfieldApi.listBounties({ status: 'COMPLETED' });
        // Filtra pelo hunter conectado
        const myCompleted = allBounties.filter(
          (b) =>
            String(b.hunter_id) === currentUser.id ||
            b.hunter_id === currentUser.github_id ||
            b.hunter?.username === currentUser.github_username
        );
        setRewards(myCompleted);
      } catch (err) {
        console.error('Erro ao carregar rewards:', err);
        setRewards([]);
      } finally {
        setLoading(false);
      }
    }

    loadRewards();
  }, [currentUser]);

  const handleCopy = (tx: string) => {
    navigator.clipboard.writeText(tx);
    setCopiedTx(tx);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const totalUsdc = rewards.reduce((sum, r) => sum + r.amount_usdc, 0);
  const totalPoints = rewards.reduce((sum, r) => sum + r.points, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252E24] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Coins className="w-8 h-8 text-[#28B110]" />
            Minhas Recompensas (Rewards)
          </h1>
          <p className="text-sm text-[#889887] mt-1">
            Histórico de tarefas concluídas e pagamentos em USDC transferidos on-chain no cluster Solana Devnet.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#161C15] border border-[#252E24] relative overflow-hidden">
          <div className="flex items-center justify-between text-[#889887] text-xs mb-2">
            <span>Total Recebido</span>
            <Coins className="w-4 h-4 text-[#28B110]" />
          </div>
          <div className="text-3xl font-black text-[#28B110]">
            ${totalUsdc.toLocaleString()} <span className="text-sm font-normal text-[#889887]">USDC</span>
          </div>
          <p className="text-[11px] text-[#687867] mt-1">
            Transferidos diretamente para sua carteira
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#161C15] border border-[#252E24]">
          <div className="flex items-center justify-between text-[#889887] text-xs mb-2">
            <span>Pontuação Total</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {totalPoints.toLocaleString()} <span className="text-sm font-normal text-[#889887]">pts</span>
          </div>
          <p className="text-[11px] text-[#687867] mt-1">
            Taxa de conversão canônica: 1 pt = 1 USDC
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#161C15] border border-[#252E24]">
          <div className="flex items-center justify-between text-[#889887] text-xs mb-2">
            <span>Tasks Concluídas</span>
            <TrendingUp className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-3xl font-black text-white">
            {rewards.length}
          </div>
          <p className="text-[11px] text-[#687867] mt-1">
            PRs revisados, aprovados e mergeados
          </p>
        </div>
      </div>

      {/* Tabela / Lista de Recompensas */}
      {loading ? (
        <div className="text-center py-16 text-[#889887]">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#28B110] mb-3"></div>
          <p className="text-sm">Carregando recompensas...</p>
        </div>
      ) : rewards.length === 0 ? (
        <div className="text-center py-16 bg-[#161C15] rounded-2xl border border-[#252E24] p-8">
          <Coins className="w-12 h-12 text-[#687867] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">Nenhuma recompensa registrada</h3>
          <p className="text-sm text-[#889887] mt-1">
            Complete tarefas e submeta PRs para receber pagamentos em USDC na rede Solana Devnet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rewards.map((bounty) => (
            <div
              key={bounty.id}
              className="bg-[#161C15] border border-[#252E24] hover:border-[#28B110]/40 rounded-2xl p-5 md:p-6 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#28B110] bg-[#192A17] border border-[#28B110]/30 px-2 py-0.5 rounded">
                      #{bounty.issue_number || bounty.id}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {bounty.issue_title || 'Bounty Concluída'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#889887] pt-1">
                    {bounty.claimed_at && (
                      <span>
                        Pago em:{' '}
                        <strong className="text-[#D2DFD1]">
                          {new Date(bounty.claimed_at).toLocaleDateString('pt-BR')}
                        </strong>
                      </span>
                    )}
                    {bounty.pr_url && (
                      <a
                        href={bounty.pr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#28B110] hover:underline inline-flex items-center gap-1"
                      >
                        PR Mergeado <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Valor e Badge On-chain */}
                <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
                  <div className="text-xl font-black text-[#28B110] flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    +${bounty.amount_usdc} USDC
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#28B110] bg-[#182618] border border-[#28B110]/40 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Pago via Devnet
                  </span>
                </div>
              </div>

              {/* Assinatura da Transação Solana */}
              {bounty.tx_signature && (
                <div className="mt-4 pt-3 border-t border-[#202720] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[#889887]">
                    <span className="font-mono text-[11px]">Tx Signature:</span>
                    <span className="font-mono text-[#D2DFD1] truncate max-w-xs sm:max-w-md">
                      {bounty.tx_signature}
                    </span>
                    <button
                      onClick={() => handleCopy(bounty.tx_signature!)}
                      className="p-1 rounded text-[#889887] hover:text-white cursor-pointer"
                      title="Copiar assinatura"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copiedTx === bounty.tx_signature && (
                      <span className="text-[10px] text-[#28B110] font-mono">Copiado!</span>
                    )}
                  </div>

                  <a
                    href={`https://explorer.solana.com/tx/${bounty.tx_signature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#28B110] hover:text-[#D9EED6] transition-colors"
                  >
                    <span>Ver no Solana Explorer</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRewardsPage;
