import React, { useState } from 'react';
import type { Bounty } from '../../../core/domain/types';
import { useApp } from '../../context/AppContext';
import { Sparkles, X, GitPullRequest, ShieldCheck, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

interface ClaimModalProps {
  bounty: Bounty | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({ bounty, onClose, onSuccess }) => {
  const { claimReward, currentUser, solanaService } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  if (!bounty) return null;

  const handleClaim = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await claimReward(bounty.id);
      setTxSignature(result.claim.transaction_signature);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao processar o resgate on-chain.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg rounded-2xl bg-[#141814] border border-[#252E24] shadow-modal p-6 sm:p-8 text-[#D2DFD1] relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#889887] hover:text-white hover:bg-[#182017] transition-colors cursor-pointer"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {txSignature ? (
          /* Estado de Sucesso */
          <div className="text-center flex flex-col items-center py-4">
            <div className="w-14 h-14 rounded-full bg-[#28B110]/20 border border-[#28B110]/40 text-[#28B110] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              USDC ${bounty.usdc_amount} Resgatado com Sucesso!
            </h3>
            <p className="text-xs text-[#889887] mt-2 max-w-sm">
              A transação foi confirmada e liquidada diretamente na rede Solana Devnet para a sua carteira.
            </p>

            <div className="w-full my-6 p-4 rounded-xl bg-[#131A12] border border-[#252E24] text-left text-xs font-mono">
              <span className="text-[#889887] block mb-1">Assinatura On-Chain:</span>
              <span className="text-[#28B110] break-all select-all font-semibold">
                {txSignature}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <a
                href={solanaService.getExplorerUrl(txSignature)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 font-semibold text-xs border border-purple-800/60 transition-colors"
              >
                <span>Ver no Solana Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-[#28B110] hover:brightness-110 text-[#141814] font-semibold text-xs transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          /* Estado Normal de Revisão */
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#182017] border border-[#252E24] text-[#28B110] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Resgatar Recompensa On-Chain
                </h3>
                <span className="text-xs text-[#889887]">
                  Solana Devnet • Contrato Sem Custódia
                </span>
              </div>
            </div>

            {/* Detalhes da Recompensa */}
            <div className="p-4 rounded-xl bg-[#131A12] border border-[#252E24] flex flex-col gap-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#252E24]">
                <span className="text-xs text-[#889887]">Valor a Receber:</span>
                <span className="text-2xl font-bold font-sans text-[#28B110]">
                  ${bounty.usdc_amount.toFixed(2)} USDC
                </span>
              </div>

              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#889887]">Issue:</span>
                  <span className="font-semibold text-white">
                    #{bounty.issue?.number} {bounty.issue?.title}
                  </span>
                </div>

                {bounty.pr && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#889887]">PR Mergeado:</span>
                    <span className="font-semibold text-[#28B110] flex items-center gap-1">
                      <GitPullRequest className="w-3.5 h-3.5" />
                      #{bounty.pr.number} (Merged)
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[#889887]">Carteira de Destino:</span>
                  <span className="font-mono text-[#D2DFD1] font-medium">
                    {currentUser.wallet_address.slice(0, 6)}...{currentUser.wallet_address.slice(-6)}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="py-3 px-5 rounded-xl border border-[#252E24] bg-[#182017] text-[#D2DFD1] hover:bg-[#20291e] text-xs font-semibold transition-colors cursor-pointer min-h-[44px]"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleClaim}
                disabled={loading}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-[#28B110] to-emerald-600 hover:brightness-110 text-[#141814] font-bold text-xs transition-all shadow-md shadow-[#28B110]/20 cursor-pointer flex items-center justify-center gap-2 min-h-[44px] interactive-btn"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Assinando Transação...' : 'Confirmar Saque On-Chain'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimModal;
