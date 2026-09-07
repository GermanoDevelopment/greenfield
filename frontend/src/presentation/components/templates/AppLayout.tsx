import React from 'react';
import Navbar from '../organisms/Navbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
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
    </div>
  );
};

export default AppLayout;
