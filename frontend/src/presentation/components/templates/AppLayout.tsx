import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import Navbar from '../organisms/Navbar';
import Sidebar from '../organisms/Sidebar';
import RoleSwitcher from '../molecules/RoleSwitcher';
import LoginModal from '../molecules/LoginModal';
import { WalletButton } from '../../../components/WalletButton';
import { getChainDisplayLabel } from '../../../client';
import { useApp } from '../../context/AppContext';
import { Menu, X, RefreshCw } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isBackendConnected, resetToDefaults } = useApp();
  const chainLabel = getChainDisplayLabel();

  if (isLanding) {
    return (
      <div className="min-h-screen bg-[#141814] text-[#D2DFD1] flex flex-col font-sans selection:bg-[#28B110] selection:text-[#141814]">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 lg:px-16 py-8">
          {children}
        </main>

        <footer className="border-t border-[#252E24] bg-[#101410] py-6 text-center text-xs text-[#889887]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#28B110]">GREENFIELD</span>
              <span>&copy; {new Date().getFullYear()}</span>
              <span>— Recompensas USDC em Solana</span>
            </div>
            <span className="font-mono text-[11px] text-[#28B110] bg-[#1A2319] border border-[#28B110]/30 px-2.5 py-0.5 rounded-md font-semibold">
              Issue → PR → Merge → USDC
            </span>
          </div>
        </footer>

        <LoginModal />
      </div>
    );
  }

  // Connected App Layout with Left Persistent Sidebar
  return (
    <div className="min-h-screen bg-[#141814] text-[#D2DFD1] flex font-sans selection:bg-[#28B110] selection:text-[#141814]">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-50">
            <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 h-16 bg-[#101410]/95 backdrop-blur-md border-b border-[#252E24] px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-2 rounded-lg text-[#9EAE9D] hover:text-[#D9EED6] hover:bg-[#1A2319] lg:hidden border border-[#252E24]"
              aria-label="Abrir Menu Lateral"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb / Title indication */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#889887]">
              <Link to="/dashboard" className="hover:text-[#28B110] transition-colors">
                Greenfield
              </Link>
              <span>/</span>
              <span className="text-[#D9EED6] font-semibold">
                {location.pathname.replace('/', '').toUpperCase() || 'DASHBOARD'}
              </span>
            </div>
          </div>

          {/* Right Controls: Network Pills + Role Switcher + Wallet */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Solana Devnet Pill */}
            <div
              className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#182017] border border-[#283426] text-[#28B110] text-[11px] font-mono font-medium"
              title={`Conectado à rede ${chainLabel}`}
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28B110] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#28B110]"></span>
              </span>
              <span>{chainLabel}</span>
            </div>

            {/* API Status Pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono font-medium ${
                isBackendConnected
                  ? 'bg-[#182017] border-[#283426] text-[#28B110]'
                  : 'bg-[#1e1c18] border-[#383020] text-amber-400'
              }`}
              title={
                isBackendConnected
                  ? 'Conectado à API FastAPI (PostgreSQL)'
                  : 'Modo Demo Local Ativo'
              }
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isBackendConnected ? 'bg-[#28B110]' : 'bg-amber-400'
                }`}
              />
              <span>{isBackendConnected ? 'API Live' : 'Demo Mode'}</span>
            </div>

            <RoleSwitcher />
            <WalletButton />

            <button
              onClick={() => resetToDefaults()}
              className="p-2 rounded-xl text-[#889887] hover:text-[#28B110] hover:bg-[#182017] border border-transparent hover:border-[#283426] transition-all hidden xl:flex items-center justify-center shrink-0 cursor-pointer"
              title="Restaurar dados iniciais do MVP"
              type="button"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Compact Footer */}
        <footer className="border-t border-[#252E24] bg-[#101410] py-4 px-4 sm:px-8 text-xs text-[#889887]">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[11px]">
              Greenfield MVP &copy; {new Date().getFullYear()} — Plataforma de Bounties em Solana Devnet
            </span>
            <span className="font-mono text-[10px] text-[#28B110] bg-[#1A2319] border border-[#28B110]/30 px-2 py-0.5 rounded">
              Canonical Invariant: 1 Point = 1 USDC
            </span>
          </div>
        </footer>
      </div>

      <LoginModal />
    </div>
  );
};

export default AppLayout;
