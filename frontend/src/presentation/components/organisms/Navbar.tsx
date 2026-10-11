import React from 'react';
import { Link } from 'react-router-dom';
import { GitPullRequest, ExternalLink } from 'lucide-react';
import RoleSwitcher from '../molecules/RoleSwitcher';
import { WalletButton } from '../../../components/WalletButton';
import { useApp } from '../../context/AppContext';
import { getChainDisplayLabel } from '../../../client';

export const Navbar: React.FC = () => {
  const { isBackendConnected } = useApp();
  const chainLabel = getChainDisplayLabel();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#252E24] bg-[#101410]/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
        {/* Linha Superior: Logo, Status da Rede, Alternador de Perfis e Carteira */}
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Status On-chain */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/Icon-only.png"
                alt="Greenfield Logo"
                className="w-9 h-9 rounded-xl object-contain transform group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  GREENFIELD
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-[#1B261A] text-[#28B110] border border-[#28B110]/40 font-bold">
                    USDC
                  </span>
                </span>
                <span className="text-[10px] text-[#889887] hidden sm:block font-medium">
                  Issue → PR → Merge → USDC
                </span>
              </div>
            </Link>

            {/* Status da Rede Solana (Pílula com pulso ativo) */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#182017] border border-[#283426] text-[#28B110] text-xs font-mono font-medium shrink-0 whitespace-nowrap shadow-xs" title={`Conectado à rede ${chainLabel}`}>
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28B110] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#28B110]"></span>
              </span>
              <span>{chainLabel}</span>
            </div>

            {/* Status da Conexão com a API Backend */}
            <div
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[11px] font-mono font-medium shrink-0 whitespace-nowrap shadow-xs ${
                isBackendConnected
                  ? 'bg-[#182017] border-[#283426] text-[#28B110]'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-400'
              }`}
              title={
                isBackendConnected
                  ? 'Conectado à API FastAPI (PostgreSQL)'
                  : 'Backend Offline / Inacessível'
              }
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isBackendConnected ? 'bg-[#28B110]' : 'bg-rose-500'
                }`}
              />
              <span>{isBackendConnected ? 'API Live' : 'API Offline'}</span>
            </div>
          </div>

          {/* Área Direita: RoleSwitcher unificado + Carteira Solana */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <RoleSwitcher />
            <WalletButton />
          </div>
        </div>

        {/* Linha Inferior: 4 Abas Principais + Link GitHub */}
        <nav className="flex items-center justify-between overflow-x-auto no-scrollbar py-2 border-t border-[#252E24]/70 -mx-4 px-4 sm:mx-0 sm:px-0">
          <a
            href="https://github.com/GermanoDevelopment/greenfield"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:flex items-center gap-1.5 text-xs text-[#889887] hover:text-[#28B110] px-2.5 py-1 rounded-lg hover:bg-[#182017] border border-transparent hover:border-[#283426] transition-all font-mono shrink-0"
            title="Repositório oficial no GitHub"
          >
            <GitPullRequest className="w-3.5 h-3.5 text-[#28B110]" />
            <span>GermanoDevelopment/greenfield</span>
            <ExternalLink className="w-3 h-3 text-[#5C6E5A]" />
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
