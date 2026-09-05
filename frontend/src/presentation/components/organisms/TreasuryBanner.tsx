import React from 'react';
import { useApp } from '../../context/AppContext';
import { Landmark } from 'lucide-react';

export const TreasuryBanner: React.FC = () => {
  const { treasury } = useApp();

  if (!treasury) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/20 p-5 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Tesouro Comunitário Greenfield</h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Pool $25.000 USDC
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Garantia on-chain de solvência. Cada bounty criada reserva USDC do pool até o Claim.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center font-mono">
          <div className="px-2">
            <span className="text-[10px] uppercase text-slate-500 block">Disponível</span>
            <span className="text-sm font-bold text-emerald-400">
              ${treasury.available_usdc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="px-2 border-x border-slate-800">
            <span className="text-[10px] uppercase text-slate-500 block">Reservado</span>
            <span className="text-sm font-bold text-amber-400">
              ${treasury.reserved_usdc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="px-2">
            <span className="text-[10px] uppercase text-slate-500 block">Pago</span>
            <span className="text-sm font-bold text-teal-400">
              ${treasury.claimed_usdc.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreasuryBanner;
