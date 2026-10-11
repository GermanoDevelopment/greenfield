import React, { useState } from 'react';
import {
  User,
  Wallet,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LogIn,
  LogOut,
  Sparkles,
  Copy,
  Check,
  KeyRound,
} from 'lucide-react';
import { useClient } from '@solana/react';
import { useConnectedWallet } from '@solana/kit-plugin-wallet/react';
import type { AppClient } from '../../client';
import { useApp } from '../context/AppContext';

export const ProfilePage: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    openLoginModal,
    logout,
    linkWalletWithProof,
  } = useApp();

  const client = useClient<AppClient>();
  const connected = useConnectedWallet(client);

  const [isLinking, setIsLinking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignora erro
    }
  };

  const handleSignAndLink = async () => {
    if (!connected?.account) return;
    setIsLinking(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await linkWalletWithProof(connected.account, connected.wallet);
      setSuccessMessage('Carteira Solana vinculada e comprovada criptograficamente com sucesso!');
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.detail || err?.message || 'Falha ao assinar desafio da carteira.'
      );
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#252E24] pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <User className="w-8 h-8 text-[#28B110]" />
          Perfil do Usuário
        </h1>
        <p className="text-sm text-[#889887] mt-1">
          Gerencie seus dados de desenvolvedor, permissões de acesso e vincule sua carteira Solana para recebimento de bounties.
        </p>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-[#182618] border border-[#28B110]/50 text-sm text-[#D9EED6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#28B110]" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-[#889887] hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-sm text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs text-rose-300 hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Card de Identidade GitHub */}
      <div className="bg-[#161C15] border border-[#252E24] rounded-2xl p-6 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#202720] pb-3">
          <Shield className="w-5 h-5 text-[#28B110]" /> Identidade & Papel na Plataforma
        </h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <img
            src={currentUser.avatar_url || 'https://github.com/ghost.png'}
            alt={currentUser.name || currentUser.github_username}
            className="w-20 h-20 rounded-2xl border-2 border-[#28B110]/40 object-cover bg-[#101410]"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xl font-bold text-white">
                {currentUser.name || currentUser.github_username}
              </h3>
              <span
                className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  currentUser.role.toUpperCase() === 'ADMIN'
                    ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                    : currentUser.role.toUpperCase() === 'MAINTAINER'
                    ? 'bg-[#192A17] text-[#28B110] border border-[#28B110]/40'
                    : 'bg-[#1D241C] text-[#9EAE9D] border border-[#252E24]'
                }`}
              >
                {currentUser.role}
              </span>
            </div>
              <p className="text-xs font-mono text-[#889887]">
                E-mail: <span className="text-[#D2DFD1]">{currentUser.email || 'Não informado'}</span>
              </p>
              {currentUser.github_id && (
                <p className="text-xs font-mono text-[#889887]">
                  GitHub ID: <span className="text-[#D2DFD1]">{currentUser.github_id}</span>
                </p>
              )}
              <p className="text-xs text-[#889887]">
                {isAuthenticated
                  ? 'Sessão autenticada no backend FastAPI com emissão de token JWT.'
                  : 'Nenhum usuário autenticado no backend. Faça login para acessar todos os recursos.'}
              </p>
            </div>
          </div>

          {/* Ações de Conta & Sessão */}
          <div className="pt-4 border-t border-[#202720] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-[#889887]">
              {isAuthenticated ? (
                <span className="text-[#D9EED6]">
                  Status da Conta: <span className="text-[#28B110] font-semibold">Conectada</span>
                </span>
              ) : (
                <span>Acesso visitante / Modo não autenticado</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-950/30 border border-rose-500/30 hover:border-rose-500/60 text-xs text-rose-300 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Encerrar Sessão</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openLoginModal}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#28B110] hover:bg-[#22950d] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Fazer Login / Registrar</span>
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Card de Carteira Solana */}
      <div className="bg-[#161C15] border border-[#252E24] rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[#202720] pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#28B110]" /> Carteira Solana Devnet
          </h2>
          <span className="text-xs font-mono text-[#28B110] bg-[#192A17] px-2.5 py-0.5 rounded border border-[#28B110]/30">
            SPL-Token USDC
          </span>
        </div>

        <p className="text-xs text-[#889887] leading-relaxed">
          As recompensas de bounties são liquidadas exclusivamente na carteira vinculada e comprovada através de assinatura criptográfica (ed25519). A inserção manual sem prova de posse foi descontinuada para segurança do protocolo.
        </p>

        {currentUser.wallet_address ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#101410] border border-[#283426] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-medium text-[#D2DFD1] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#28B110]" />
                  Carteira Vinculada & Comprovada
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#28B110] font-mono font-semibold bg-[#182618] px-2.5 py-0.5 rounded-full border border-[#28B110]/30">
                  <Check className="w-3 h-3" /> Assinatura Válida
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 bg-[#141C14] px-3.5 py-2.5 rounded-lg border border-[#202720]">
                <span className="font-mono text-xs text-[#28B110] font-bold break-all">
                  {currentUser.wallet_address}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(currentUser.wallet_address)}
                  className="inline-flex items-center gap-1 text-xs text-[#889887] hover:text-[#28B110] shrink-0 p-1 rounded hover:bg-[#182017] transition-colors cursor-pointer"
                  title="Copiar endereço"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#28B110]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-[#889887] pt-1">
                <span>
                  {connected?.account?.address?.toLowerCase() === currentUser.wallet_address.toLowerCase()
                    ? 'Esta carteira está ativa e conectada no seu navegador.'
                    : connected?.account
                    ? `Navegador conectado a outra carteira (${connected.account.address.slice(0, 4)}...${connected.account.address.slice(-4)}).`
                    : 'Nenhuma carteira conectada no navegador no momento.'}
                </span>
                <a
                  href={`https://explorer.solana.com/address/${currentUser.wallet_address}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#28B110] hover:underline font-mono text-xs"
                >
                  Explorer <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {connected?.account && connected.account.address.toLowerCase() !== currentUser.wallet_address.toLowerCase() && (
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-200">
                    Deseja trocar para a carteira conectada?
                  </span>
                  <span className="text-[11px] font-mono text-amber-400">
                    {connected.account.address.slice(0, 6)}...{connected.account.address.slice(-6)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSignAndLink}
                  disabled={isLinking}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#28B110] hover:bg-[#20920C] text-[#101410] font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLinking ? (
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <KeyRound className="w-3.5 h-3.5" />
                  )}
                  <span>{isLinking ? 'Assinando Desafio...' : 'Assinar e Vincular Nova Carteira'}</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 rounded-xl bg-[#101410] border border-[#283426] space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#1B261A] text-[#28B110] border border-[#28B110]/30 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  {connected?.account
                    ? 'Carteira Detectada no Navegador'
                    : 'Nenhuma Carteira Vinculada'}
                </h3>
                <p className="text-xs text-[#889887] leading-relaxed">
                  {connected?.account
                    ? `A carteira ${connected.account.address.slice(0, 6)}...${connected.account.address.slice(-6)} está pronta para ser vinculada ao seu usuário mediante assinatura de desafio.`
                    : 'Para vincular sua carteira Solana e garantir o recebimento de bounties, conecte uma carteira (Phantom, Solflare, etc.) no topo da página e autorize a assinatura do desafio.'}
                </p>
              </div>
            </div>

            {connected?.account ? (
              <button
                type="button"
                onClick={handleSignAndLink}
                disabled={isLinking}
                className="px-5 py-2.5 rounded-xl bg-[#28B110] hover:bg-[#20920C] text-[#101410] font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLinking ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>{isLinking ? 'Assinando Desafio...' : 'Assinar Desafio e Vincular Carteira'}</span>
              </button>
            ) : (
              <div className="p-3 bg-[#141C14] rounded-lg border border-[#202720] text-[11px] text-[#889887] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Clique no botão <strong>Conectar Carteira</strong> no topo para iniciar.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Regras e Invariantes do Usuário */}
      <div className="bg-[#161C15] border border-[#252E24] rounded-2xl p-6 space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" /> Invariantes de Governança
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#889887]">
          <div className="p-3 bg-[#101410] rounded-xl border border-[#202720]">
            <strong className="text-[#D2DFD1] block mb-1">1. Anti Double-Claim</strong>
            Uma recompensa só pode ser transferida uma única vez após a verificação on-chain do PR.
          </div>
          <div className="p-3 bg-[#101410] rounded-xl border border-[#202720]">
            <strong className="text-[#D2DFD1] block mb-1">2. Tesouraria Solvente</strong>
            Bounties só são abertas com lastro garantido no cofre de tesouraria do protocolo.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
