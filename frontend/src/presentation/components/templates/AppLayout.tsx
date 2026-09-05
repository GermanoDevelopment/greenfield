import React from 'react';
import Navbar from '../organisms/Navbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GREENFIELD &copy; {new Date().getFullYear()} — Solana USDC Developer Rewards</span>
          <span className="font-mono text-[11px] text-slate-600">
            Regra Central: Issue → PR → Merge → USDC
          </span>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
