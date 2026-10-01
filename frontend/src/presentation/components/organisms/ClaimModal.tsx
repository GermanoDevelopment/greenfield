import React, { useState } from 'react';
import type { Bounty, Claim } from '../../../core/domain/types';
import { useApp } from '../../context/AppContext';
import { useClient } from '@solana/react';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import { address } from '@solana/kit';
import type { AppClient } from '../../../client';
import {
  resolveClaimAccounts,
  buildClaimInstruction,
  GreenfieldProgramNotConfiguredError,
} from '../../../lib/greenfieldProgram';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  X,
  AlertCircle,
  GitPullRequest,
} from 'lucide-react';
import DesygenButton from '../atoms/DesygenButton';
import SolanaAddressPill from '../atoms/SolanaAddressPill';

interface ClaimModalProps {
  bounty: Bounty | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({ bounty, onClose, onSuccess }) => {
  const { claimReward, solanaService, currentUser } = useApp();
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimResult, setClaimResult] = useState<Claim | null>(bounty?.claim || null);

  if (!bounty) return null;

  const handleExecuteClaim = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!connected?.account?.address) {
        throw new Error('Conecte sua carteira Solana para assinar o resgate on-chain.');
      }

      // 1. Assina a transação de claim diretamente na Solana com a carteira conectada.
      // Qualquer falha aqui interrompe o fluxo — não há fallback simulado.
      const accounts = await resolveClaimAccounts(address(connected.account.address), Number(bounty.id));
      const instruction = await buildClaimInstruction(accounts);
      const result = await client.sendTransaction([instruction]);
      const onchainTxSignature = result.context.signature;

      // 2. Sincroniza o resgate confirmado com o backend/estado local
      const { claim } = await claimReward(bounty.id);
      claim.transaction_signature = onchainTxSignature;
      setClaimResult(claim);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (err instanceof GreenfieldProgramNotConfiguredError) {
        setError('O programa on-chain não está configurado neste ambiente. Resgate indisponível.');
      } else {
        setError(err.message || 'Erro ao processar o resgate on-chain.');
      }
    } finally {
      setLoading(false);
    }
  };

  const explorerUrl = claimResult
    ? solanaService.getExplorerUrl(claimResult.transaction_signature)
    : '';

  const destinationWallet = connected?.account?.address || currentUser.wallet_address;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg rounded-2xl bg-[#141814] border border-[#252E24] shadow-2xl p-6 sm:p-8 text-[#D2DFD1] relative overflow-hidden"
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

        {claimResult ? (
          /* Estado de Sucesso com Comprovante On-Chain */
          <div className="text-center flex flex-col items-center py-2">
            <div className="w-14 h-14 rounded-full bg-[#28B110]/20 border border-[#28B110]/40 text-[#28B110] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              ${bounty.usdc_amount.toFixed(2)} USDC Resgatado com Sucesso!
            </h3>
            <p className="text-xs text-[#889887] mt-1.5 max-w-sm">
              A transação foi confirmada e liquidada diretamente na rede Solana Devnet para a sua carteira.
            </p>

            <div className="w-full my-5 p-4 rounded-xl bg-[#131A12] border border-[#252E24] text-left text-xs font-mono flex flex-col gap-2">
              <div className="flex justify-between items-center text-[#889887]">
                <span>Assinatura On-Chain:</span>
                <span className="text-[#28B110] font-semibold">Confirmada</span>
              </div>
              <div className="p-2 rounded-lg bg-[#182017] text-[#28B110] break-all select-all font-semibold text-[11px]">
                {claimResult.transaction_signature}
              </div>
              <div className="flex justify-between items-center text-[#889887] pt-1">
                <span>Destino:</span>
                <span className="text-[#D2DFD1] font-mono truncate max-w-[200px]">
                  {claimResult.wallet_address}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 font-semibold text-xs border border-purple-800/60 transition-colors"
              >
                <span>Ver no Solana Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <DesygenButton
                variant="primary"
                size="md"
                onClick={onClose}
                className="flex-1"
              >
                Concluir
              </DesygenButton>
            </div>
          </div>
        ) : (
          /* Estado Normal de Revisão */
          <div className="flex flex-col gap-5">
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
                  <span className="font-semibold text-white truncate max-w-[280px]">
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

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[#889887]">Carteira de Destino:</span>
                  <SolanaAddressPill address={destinationWallet} />
                </div>
              </div>
            </div>

            {/* Invariante 3 & Segurança */}
            <div className="text-xs text-[#889887] flex items-start gap-2 bg-[#182017]/60 p-3 rounded-xl border border-[#252E24]">
              <ShieldCheck className="w-4 h-4 text-[#28B110] shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Invariante 3:</strong> Esta transação previne double-claim on-chain. Uma
                vez assinada, os fundos são liquidados do contrato e o status é permanentemente concluído.
              </span>
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

              <DesygenButton
                variant="primary"
                size="lg"
                isLoading={loading}
                onClick={handleExecuteClaim}
                className="flex-1 !py-3 !text-sm font-bold shadow-md shadow-[#28B110]/20"
              >
                Assinar na Wallet & Resgatar ${bounty.usdc_amount.toFixed(2)} USDC
              </DesygenButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimModal;
