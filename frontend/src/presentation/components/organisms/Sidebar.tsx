import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderGit2,
  ListTodo,
  Coins,
  User,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  LogIn,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const {
    currentUser,
    isAuthenticated,
    openLoginModal,
    logout,
    isBackendConnected,
  } = useApp();

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      description: 'Visão geral e métricas',
    },
    {
      label: 'Repositórios',
      path: '/repositories',
      icon: FolderGit2,
      description: 'Projetos cadastrados',
    },
    {
      label: 'Issues & Bounties',
      path: '/issues',
      icon: ListTodo,
      description: 'Tarefas e pontuações',
    },
    {
      label: 'Minhas Rewards',
      path: '/rewards',
      icon: Coins,
      description: 'Recompensas USDC',
    },
    {
      label: 'Meu Perfil',
      path: '/profile',
      icon: User,
      description: 'GitHub e Carteira',
    },
    {
      label: 'Painel Admin',
      path: '/admin',
      icon: ShieldCheck,
      description: 'Gestão e moderação',
      badge: 'Admin',
    },
  ];

  return (
    <aside className="w-64 bg-[#101410] border-r border-[#252E24] flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#252E24] flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 group"
          onClick={onCloseMobile}
          title="Ir para Landing Page"
        >
          <img
            src="/Icon-only.png"
            alt="Greenfield Logo"
            className="w-8 h-8 rounded-lg object-contain shadow-sm group-hover:scale-105 transition-transform"
          />
          <div>
            <span className="text-base font-black tracking-wider text-[#D9EED6] block leading-none">
              GREEN<span className="text-[#28B110]">FIELD</span>
            </span>
            <span className="text-[10px] font-mono text-[#889887] tracking-widest">
              DEVNET MVP
            </span>
          </div>
        </Link>
      </div>

      {/* Network & Backend Status Badges */}
      <div className="px-4 py-3 border-b border-[#1E251E] bg-[#141814]/60 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#889887] flex items-center gap-1.5 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28B110] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#28B110]"></span>
            </span>
            Solana Devnet
          </span>
          <span className="text-[10px] font-mono text-[#28B110] bg-[#192A17] border border-[#28B110]/30 px-2 py-0.5 rounded">
            Active
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-[#889887] flex items-center gap-1.5 font-medium">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isBackendConnected ? 'bg-[#28B110]' : 'bg-amber-500'
              }`}
            />
            Backend API
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isBackendConnected
                ? 'text-[#28B110] bg-[#192A17] border-[#28B110]/30'
                : 'text-amber-400 bg-amber-950/40 border-amber-500/30'
            }`}
          >
            {isBackendConnected ? 'FastAPI Online' : 'API Desconectada'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#687867]">
          Navegação Principal
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#1D2B1A] text-[#28B110] border-l-4 border-[#28B110] shadow-inner font-semibold'
                    : 'text-[#9EAE9D] hover:text-[#D9EED6] hover:bg-[#161C15]'
                }`
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="w-5 h-5 flex-shrink-0 transition-colors group-hover:text-[#28B110]" />
                <div className="truncate">
                  <span className="block leading-none">{item.label}</span>
                  <span className="text-[10px] text-[#6B7C6A] block mt-0.5">
                    {item.description}
                  </span>
                </div>
              </div>

              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#28B110]/20 text-[#28B110] border border-[#28B110]/40 uppercase tracking-tight">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Authentication Section */}
      <div className="p-4 border-t border-[#252E24] bg-[#141814]/80 space-y-3">
        {isAuthenticated ? (
          <>
            {/* Connected User Pill */}
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar_url || 'https://github.com/ghost.png'}
                alt={currentUser.name || currentUser.github_username}
                className="w-9 h-9 rounded-full border border-[#28B110]/40 object-cover bg-[#1A2319]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-[#D9EED6] truncate">
                    {currentUser.name || currentUser.github_username}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
                      currentUser.role.toUpperCase() === 'ADMIN'
                        ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40'
                        : currentUser.role.toUpperCase() === 'MAINTAINER'
                        ? 'bg-[#192A17] text-[#28B110] border border-[#28B110]/40'
                        : 'bg-[#1A2319] text-[#889887] border border-[#252E24]'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-[#889887] truncate">
                  {currentUser.email ||
                    (currentUser.wallet_address
                      ? `${currentUser.wallet_address.slice(0, 4)}...${currentUser.wallet_address.slice(-4)}`
                      : 'Sem carteira')}
                </p>
              </div>
            </div>

            {/* Logout Action */}
            <button
              onClick={logout}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg bg-[#1A2319] border border-[#252E24] hover:border-rose-500/40 hover:bg-rose-950/20 text-xs text-[#889887] hover:text-rose-300 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair da Conta</span>
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-[#889887]">
              <KeyRound className="w-4 h-4 text-[#28B110]" />
              <span className="font-medium text-[#D9EED6]">Área Administrativa</span>
            </div>
            <button
              onClick={openLoginModal}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#28B110] hover:bg-[#22950d] text-white text-xs font-bold shadow-sm shadow-[#28B110]/20 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Fazer Login</span>
            </button>
          </div>
        )}

        {/* Back to LP link */}
        <Link
          to="/"
          className="flex items-center justify-between text-xs text-[#889887] hover:text-[#28B110] pt-1 transition-colors"
        >
          <span className="flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" /> Ver Landing Page
          </span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
