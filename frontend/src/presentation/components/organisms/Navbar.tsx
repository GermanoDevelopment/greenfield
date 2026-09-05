import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Award, History, Sparkles } from 'lucide-react';
import RoleSwitcher from '../molecules/RoleSwitcher';
import WalletConnectMolecule from '../molecules/WalletConnectMolecule';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { currentUser, resetToDefaults } = useApp();

  const isMaintainer = currentUser.role === 'maintainer';

  const navLinks = [
    { label: 'Visão Geral', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    ...(isMaintainer
      ? [{ label: 'Criar Bounty', path: '/bounties/new', icon: <PlusCircle className="w-4 h-4" /> }]
      : [
          { label: 'Minhas Contribuições', path: '/contributions', icon: <Award className="w-4 h-4" /> },
          { label: 'Claim USDC', path: '/claim', icon: <Sparkles className="w-4 h-4 text-emerald-400" /> },
        ]),
    { label: 'Histórico', path: '/history', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#145907]/60 bg-[#1B1E1A]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo Oficial */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src="/Icon-only.png"
                alt="Greenfield Logo"
                className="w-9 h-9 rounded-xl object-contain transform group-hover:scale-110 transition-transform shadow-md shadow-[#145907]/40"
              />
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  GREENFIELD
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#145907]/60 text-[#D9EED6] border border-[#28B110]/40 font-bold">
                    MVP
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block">
                  Issue → PR → Merge → USDC
                </span>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white border border-slate-800'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Controls: Role Switcher & Solana Wallet */}
          <div className="flex items-center gap-3">
            <RoleSwitcher />
            <WalletConnectMolecule />

            <button
              onClick={() => resetToDefaults()}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors hidden xl:block"
              title="Restaurar dados iniciais do MVP"
            >
              Reset Demo
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
