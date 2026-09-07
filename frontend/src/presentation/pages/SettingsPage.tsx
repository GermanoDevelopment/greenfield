import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useClient } from '@solana/react';
import { useConnectedWallet, useDisconnect } from '@solana/kit-plugin-wallet/react';
import type { AppClient } from '../../client';
import {
  Settings,
  Wallet,
  Shield,
  Bell,
  AlertTriangle,
  Check,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import DesygenButton from '../components/atoms/DesygenButton';

const GithubIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export const SettingsPage: React.FC = () => {
  const { currentUser } = useApp();
  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);
  const disconnectAction = useDisconnect(client);

  // 1. Limites de Segurança
  const [maxBountyUsdc, setMaxBountyUsdc] = useState<number>(() => {
    const saved = localStorage.getItem('greenfield_max_bounty_usdc');
    return saved ? Number(saved) : 1000;
  });
  const [savedLimitFeedback, setSavedLimitFeedback] = useState(false);

  // 2. Preferências de Notificação
  const [notifyPrOpen, setNotifyPrOpen] = useState(true);
  const [notifyClaimSuccess, setNotifyClaimSuccess] = useState(true);
  const [discordWebhook, setDiscordWebhook] = useState('');

  // 3. Zona de Risco (Confirmação em Duas Etapas)
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const handleSaveLimits = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('greenfield_max_bounty_usdc', maxBountyUsdc.toString());
    setSavedLimitFeedback(true);
    setTimeout(() => setSavedLimitFeedback(false), 2500);
  };

  const handleConfirmDisconnect = async () => {
    try {
      await disconnectAction.dispatchAsync();
      setShowDisconnectModal(false);
    } catch (err) {
      console.error('Erro ao desconectar carteira:', err);
    }
  };

  const currentWalletAddress =
    connected?.account?.address || currentUser.wallet_address;

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="border-b border-[#252E24] pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-[#28B110]" />
          <span>Configurações do Ecossistema</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#889887] mt-1">
          Gerencie integrações com GitHub, endereço da carteira Solana, tetos de segurança e preferências.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* ================= 1. CONEXÕES ================= */}
        <section className="rounded-2xl border border-[#252E24] bg-[#182017] p-6 sm:p-7 shadow-card flex flex-col gap-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <GithubIcon className="w-5 h-5 text-[#D2DFD1]" />
              <span>1. Conexões de Contas & Rede</span>
            </h2>
            <p className="text-xs text-[#889887] mt-0.5">
              Identidades vinculadas aos contratos inteligentes e à sincronização de repositórios.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* GitHub Card */}
            <div className="p-4 rounded-xl bg-[#131A12] border border-[#252E24] flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#1B221A] text-[#D2DFD1] flex items-center justify-center border border-[#252E24]">
                    <GithubIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      GitHub OAuth
                    </span>
                    <span className="text-xs font-mono text-[#28B110] font-bold">
                      @{currentUser.github_username}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#28B110]/20 text-[#28B110] border border-[#28B110]/30 text-[11px] font-semibold">
                  <Check className="w-3 h-3" /> Conectado
                </span>
              </div>
              <p className="text-[11px] text-[#889887]">
                Repositórios autorizados: <strong>Solana-USDC-Escrow</strong>, <strong>greenfield-core</strong>.
              </p>
            </div>

            {/* Solana Wallet Card */}
            <div className="p-4 rounded-xl bg-[#131A12] border border-[#252E24] flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-950/40 text-purple-400 flex items-center justify-center border border-purple-800/40">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Carteira Solana
                    </span>
                    <span className="text-xs font-mono text-purple-300 font-bold truncate max-w-[140px] block" title={currentWalletAddress}>
                      {currentWalletAddress.slice(0, 6)}...{currentWalletAddress.slice(-6)}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-950/40 text-purple-300 border border-purple-800/60 text-[11px] font-semibold font-mono">
                  Devnet
                </span>
              </div>
              <a
                href={`https://explorer.solana.com/address/${currentWalletAddress}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 hover:underline"
              >
                <span>Ver no Solana Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </section>

        {/* ================= 2. LIMITES DE SEGURANÇA ================= */}
        <section className="rounded-2xl border border-[#252E24] bg-[#182017] p-6 sm:p-7 shadow-card flex flex-col gap-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#28B110]" />
              <span>2. Limites de Governança & Segurança</span>
            </h2>
            <p className="text-xs text-[#889887] mt-0.5">
              Proteção contra emissão de recompensas que excedam as diretrizes do tesouro.
            </p>
          </div>

          <form onSubmit={handleSaveLimits} className="flex flex-col sm:flex-row items-end gap-4 max-w-lg">
            <div className="flex-1 flex flex-col gap-1.5 w-full">
              <label className="text-xs font-bold uppercase tracking-wider text-[#889887]">
                Teto Máximo de USDC por Bounty
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#889887]">
                  $
                </span>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  step="50"
                  value={maxBountyUsdc}
                  onChange={(e) => setMaxBountyUsdc(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#131A12] border border-[#252E24] font-mono text-sm font-bold text-white focus:outline-none focus:border-[#28B110] min-h-[44px]"
                />
              </div>
              <span className="text-[11px] text-[#889887]">
                Qualquer criação que ultrapassar este valor exigirá aprovação multi-sig.
              </span>
            </div>

            <DesygenButton
              type="submit"
              variant="secondary"
              size="md"
              className="w-full sm:w-auto min-h-[44px] font-bold border-[#252E24] bg-[#131A12] text-[#D2DFD1] hover:bg-[#20291e]"
            >
              {savedLimitFeedback ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#28B110]" />
                  <span>Salvo!</span>
                </>
              ) : (
                <span>Atualizar Teto</span>
              )}
            </DesygenButton>
          </form>
        </section>

        {/* ================= 3. PREFERÊNCIAS DE NOTIFICAÇÃO ================= */}
        <section className="rounded-2xl border border-[#252E24] bg-[#182017] p-6 sm:p-7 shadow-card flex flex-col gap-5">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              <span>3. Preferências de Alertas & Notificações</span>
            </h2>
            <p className="text-xs text-[#889887] mt-0.5">
              Receba avisos instantâneos sobre o ciclo de vida das suas issues e transações.
            </p>
          </div>

          <div className="flex flex-col gap-3 max-w-lg">
            {/* Toggle 1: PR Aberto */}
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#131A12] border border-[#252E24] cursor-pointer hover:bg-[#1f281e] transition-colors">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">
                  Notificar quando um Pull Request for aberto
                </span>
                <span className="text-[11px] text-[#889887]">
                  Aviso para revisão de código e merge pelo mantenedor.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyPrOpen}
                onChange={(e) => setNotifyPrOpen(e.target.checked)}
                className="w-4 h-4 rounded text-[#28B110] focus:ring-[#28B110] cursor-pointer accent-[#28B110]"
              />
            </label>

            {/* Toggle 2: Recompensa Resgatada */}
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#131A12] border border-[#252E24] cursor-pointer hover:bg-[#1f281e] transition-colors">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white">
                  Notificar quando o desenvolvedor resgatar USDC (Claim)
                </span>
                <span className="text-[11px] text-[#889887]">
                  Recibo com link para o Solana Explorer do pagamento liquidado.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifyClaimSuccess}
                onChange={(e) => setNotifyClaimSuccess(e.target.checked)}
                className="w-4 h-4 rounded text-[#28B110] focus:ring-[#28B110] cursor-pointer accent-[#28B110]"
              />
            </label>

            {/* Webhook opcional Discord */}
            <div className="flex flex-col gap-1.5 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#889887]">
                Webhook Discord (Opcional)
              </label>
              <input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={discordWebhook}
                onChange={(e) => setDiscordWebhook(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#131A12] border border-[#252E24] text-xs font-mono text-[#D2DFD1] focus:outline-none focus:border-[#28B110] min-h-[44px]"
              />
            </div>
          </div>
        </section>

        {/* ================= 4. ZONA DE RISCO ================= */}
        <section className="rounded-2xl border border-rose-900/60 bg-rose-950/20 p-6 sm:p-7 shadow-card flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>4. Zona de Risco</span>
            </h2>
            <p className="text-xs text-rose-300/80 mt-0.5">
              Ações críticas que encerram a sessão atual e revogam permissões de assinatura da carteira.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#131A12] border border-rose-900/40">
            <div>
              <span className="text-xs font-bold text-white block">
                Desconectar Carteira Solana
              </span>
              <span className="text-xs text-[#889887]">
                Encerra a conexão segura com a carteira {connected?.wallet?.name || 'conectada'}.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowDisconnectModal(true)}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer self-start sm:self-auto interactive-btn shadow-sm"
            >
              Desconectar Carteira
            </button>
          </div>
        </section>
      </div>

      {/* Modal de Confirmação em Duas Etapas para Desconexão */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-md rounded-2xl bg-[#141814] border border-rose-900/60 shadow-modal p-6 text-[#D2DFD1] relative"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-950/50 border border-rose-800/40 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Confirmar Desconexão
                </h3>
                <span className="text-xs text-[#889887]">Etapa 2 de 2 • Verificação de Segurança</span>
              </div>
            </div>

            <p className="text-xs text-[#889887] mb-6 leading-relaxed">
              Tem certeza que deseja desconectar a carteira{' '}
              <strong className="font-mono text-white">
                {currentWalletAddress.slice(0, 8)}...{currentWalletAddress.slice(-8)}
              </strong>
              ? Você precisará autorizar a carteira novamente para criar ou resgatar recompensas on-chain.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#252E24] bg-[#182017] text-[#D2DFD1] hover:bg-[#20291e] text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDisconnect}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer interactive-btn shadow-sm"
              >
                Sim, Desconectar Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
