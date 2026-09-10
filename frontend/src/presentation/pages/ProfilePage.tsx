import React, { useState, useEffect } from 'react';
import {
  User,
  Wallet,
  Shield,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  LogIn,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { greenfieldApi } from '../../services/api';

export const ProfilePage: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    isAuthenticated,
    openLoginModal,
    logout,
    isBackendConnected,
  } = useApp();
  const [walletInput, setWalletInput] = useState(currentUser.wallet_address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setWalletInput(currentUser.wallet_address || '');
  }, [currentUser]);

  const handleSaveWallet = async () => {
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      if (isBackendConnected) {
        await greenfieldApi.updateWallet(walletInput);
      }
      // Atualiza estado local
      setCurrentUser({
        ...currentUser,
        wallet_address: walletInput,
      });
      setSuccessMessage('Endereço de carteira Solana atualizado com sucesso no backend!');
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.detail || 'Erro ao sincronizar carteira com o backend.'
      );
    } finally {
      setIsSaving(false);
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
          Esta é a chave pública (base58) para a qual as recompensas em USDC serão liquidadas automaticamente on-chain após o merge do seu Pull Request.
        </p>

        <div className="space-y-2">
          <label className="text-xs text-[#D2DFD1] font-medium block">
            Endereço da Carteira Solana (Public Key base58):
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              placeholder="Ex: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
              className="flex-1 bg-[#101410] border border-[#252E24] rounded-xl px-4 py-2.5 text-xs font-mono text-[#D2DFD1] placeholder-[#687867] focus:outline-none focus:border-[#28B110]"
            />
            <button
              onClick={handleSaveWallet}
              disabled={isSaving || !walletInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#28B110] hover:brightness-110 disabled:opacity-50 text-[#101410] font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Salvar Carteira'}
            </button>
          </div>
        </div>

        {currentUser.wallet_address && (
          <div className="pt-2 flex items-center justify-between text-xs text-[#889887]">
            <span className="font-mono text-[11px]">
              Carteira ativa no perfil:{' '}
              <strong className="text-[#28B110]">
                {currentUser.wallet_address.slice(0, 8)}...{currentUser.wallet_address.slice(-8)}
              </strong>
            </span>
            <a
              href={`https://explorer.solana.com/address/${currentUser.wallet_address}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#28B110] hover:underline font-mono"
            >
              Explorer <ExternalLink className="w-3 h-3" />
            </a>
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
