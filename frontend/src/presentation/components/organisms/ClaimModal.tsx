import React, { useState } from 'react';
import type { Bounty, Claim } from '../../../core/domain/types';
import { useApp } from '../../context/AppContext';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  X,
  AlertCircle,
  Coins,
} from 'lucide-react';
import DesygenButton from '../atoms/DesygenButton';
import SolanaAddressPill from '../atoms/SolanaAddressPill';

interface ClaimModalProps {
  bounty: Bounty;
  onClose: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({ bounty, onClose }) => {
  const { claimReward, solanaService, currentUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimResult, setClaimResult] = useState<Claim | null>(bounty.claim || null);

  const handleExecuteClaim = async () => {
    setLoading(true);
    setError(null);
    try {
      const { claim } = await claimReward(bounty.id);
      setClaimResult(claim);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar claim on-chain.');
    } finally {
      setLoading(false);
    }
  };

  const explorerUrl = claimResult
    ? solanaService.getExplorerUrl(claimResult.transaction_signature)
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Sparkles className="w-5 h-5" />
            <span>Resgate de Recompensa (Claim USDC)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {!claimResult ? (
            <>
              {/* Informações da Bounty */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
                <span className="text-xs font-mono text-slate-400 uppercase">
                  Contribuição Aprovada
                </span>
                <h4 className="text-base font-bold text-white">
                  Issue #{bounty.issue?.number}: {bounty.issue?.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                  <span>Repositório:</span>
                  <strong className="text-slate-200">
                    {bounty.repository?.owner}/{bounty.repository?.name}
                  </strong>
                </div>
              </div>

              {/* Valor a receber */}
              <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center flex flex-col items-center">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                  Valor a ser transferido instantaneamente
                </span>
                <div className="text-4xl font-extrabold font-mono text-white mt-1">
                  ${bounty.usdc_amount.toFixed(2)}{' '}
                  <span className="text-emerald-400 text-2xl">USDC</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Conversão: {bounty.points.toLocaleString()} pontos @ 100pts = $1 USDC</span>
                </div>
              </div>

              {/* Carteira de Destino */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-400">
                  Carteira Solana de Destino (Devnet)
                </label>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <SolanaAddressPill address={currentUser.wallet_address} />
                  <span className="text-xs text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Conectada
                  </span>
                </div>
              </div>

              {/* Invariante 3 & Segurança */}
              <div className="text-xs text-slate-400 flex items-start gap-2 bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Invariante 3:</strong> Esta transação previne double-claim on-chain. Uma
                  vez assinado, os fundos são liquidados do contrato e o status é permanentemente
                  concluído.
                </span>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Botão de Ação */}
              <DesygenButton
                variant="primary"
                size="lg"
                isLoading={loading}
                onClick={handleExecuteClaim}
                className="w-full !py-3.5 !text-base font-bold shadow-lg shadow-emerald-950/50"
              >
                Assinar na Wallet & Resgatar ${bounty.usdc_amount} USDC
              </DesygenButton>
            </>
          ) : (
            /* Sucesso - Comprovante On-Chain */
            <div className="flex flex-col items-center text-center gap-4 py-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">Claim Confirmado On-Chain!</h3>
                <p className="text-sm text-slate-300 mt-1">
                  Os <strong>${bounty.usdc_amount} USDC</strong> foram transferidos para sua carteira Solana.
                </p>
              </div>

              <div className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-left flex flex-col gap-2 font-mono text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Assinatura da Transação:</span>
                  <span className="text-emerald-400">Confirmada</span>
                </div>
                <div className="p-2 rounded bg-slate-900 text-slate-300 break-all text-[11px]">
                  {claimResult.transaction_signature}
                </div>
                <div className="flex justify-between text-slate-400 pt-1">
                  <span>Carteira de Destino:</span>
                  <span className="text-slate-300 font-bold truncate max-w-[200px]">
                    {claimResult.wallet_address}
                  </span>
                </div>
              </div>

              <div className="w-full flex flex-col gap-2 pt-2">
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                >
                  <span>Ver Transação no Solana Explorer (Devnet)</span>
                  <ExternalLink className="w-4 h-4" />
                </a>

                <DesygenButton
                  variant="secondary"
                  size="md"
                  onClick={onClose}
                  className="w-full"
                >
                  Fechar
                </DesygenButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClaimModal;
