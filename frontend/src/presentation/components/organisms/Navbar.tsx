import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, Settings, ShieldCheck } from 'lucide-react';
import RoleSwitcher from '../molecules/RoleSwitcher';
import { WalletButton } from '../../../components/WalletButton';
import { useApp } from '../../context/AppContext';
import { getChainDisplayLabel } from '../../../client';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { currentUser, resetToDefaults } = useApp();
  const chainLabel = getChainDisplayLabel();

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Nova Bounty', path: '/bounties/new', icon: <PlusCircle className="w-4 h-4" /> },
    { label: 'Histórico', path: '/history', icon: <History className="w-4 h-4" /> },
    { label: 'Configurações', path: '/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#EEF2F6] bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
        {/* Linha Superior: Logo, Status da Rede, Avatar GitHub & Carteira */}
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Status On-chain */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src="/Icon-only.png"
                alt="Greenfield Logo"
                className="w-9 h-9 rounded-xl object-contain transform group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                  GREENFIELD
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                    USDC
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:block">
                  Issue → PR → Merge → USDC
                </span>
              </div>
            </Link>

            {/* Status da Rede Solana */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>{chainLabel}</span>
            </div>
          </div>

          {/* Área Direita: Avatar GitHub + RoleSwitcher + Carteira */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Avatar do Usuário Conectado ao GitHub */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <img
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                alt={currentUser.github_username}
                className="w-5 h-5 rounded-full border border-slate-300 object-cover"
              />
              <span className="font-mono text-slate-700 font-semibold">
                @{currentUser.github_username}
              </span>
            </div>

            <RoleSwitcher />
            <WalletButton />

            <button
              onClick={() => resetToDefaults()}
              className="text-[11px] text-slate-400 hover:text-slate-700 transition-colors hidden xl:block ml-1"
              title="Restaurar dados iniciais do MVP"
            >
              Reset Demo
            </button>
          </div>
        </div>

        {/* Linha Inferior: 4 Abas Principais (Rolável horizontalmente no mobile) */}
        <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-t border-slate-100 -mx-4 px-4 sm:mx-0 sm:px-0">
          {navLinks.map((link) => {
            const isActive =
              location.pathname === link.path ||
              (link.path === '/bounties/new' && location.pathname.startsWith('/bounties/new'));

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap min-h-[38px] ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
