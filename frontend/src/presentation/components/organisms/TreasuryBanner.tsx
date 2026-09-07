import React from 'react';
import { useApp } from '../../context/AppContext';
import { Landmark } from 'lucide-react';

export const TreasuryBanner: React.FC = () => {
  const { treasury } = useApp();

  if (!treasury) return null;

  return (
    <div className="rounded-2xl bg-[#182017] border border-[#252E24] p-5 sm:p-6 shadow-card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-[#1E281C] border border-[#28B110]/30 text-[#28B110] shrink-0">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">Tesouro Comunitário Greenfield</h3>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#1A2518] text-[#28B110] border border-[#28B110]/30">
                Pool $25.000 USDC
              </span>
            </div>
            <p className="text-xs text-[#889887] mt-1">
              Garantia on-chain de solvência. Cada bounty criada reserva USDC do pool até o Claim.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-[#131A12] p-2.5 rounded-xl border border-[#252E24] text-center font-mono">
          <div className="px-2">
            <span className="text-[10px] uppercase font-sans font-medium text-[#889887] block">Disponível</span>
            <span className="text-sm font-bold text-[#28B110]">
              ${treasury.available_usdc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="px-2 border-x border-[#252E24]">
            <span className="text-[10px] uppercase font-sans font-medium text-[#889887] block">Reservado</span>
            <span className="text-sm font-bold text-amber-400">
              ${treasury.reserved_usdc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="px-2">
            <span className="text-[10px] uppercase font-sans font-medium text-[#889887] block">Pago</span>
            <span className="text-sm font-bold text-[#9EB19D]">
              ${treasury.claimed_usdc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreasuryBanner;
