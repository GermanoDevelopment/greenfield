import React from 'react';
import Navbar from '../organisms/Navbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 lg:px-16 py-8">
        {children}
      </main>

      <footer className="border-t border-[#EEF2F6] bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">GREENFIELD</span>
            <span>&copy; {new Date().getFullYear()}</span>
            <span>— Recompensas USDC em Solana</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            Issue → PR → Merge → USDC
          </span>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
