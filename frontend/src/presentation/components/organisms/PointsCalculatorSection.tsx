import React, { useState } from 'react';
import { pointsToUsdc } from '../../../core/domain/types';
import { ArrowRightLeft } from 'lucide-react';

const PRESETS = [
  { points: 500, usdc: 5, label: 'Bug Fix' },
  { points: 1000, usdc: 10, label: 'Minor Feature' },
  { points: 5000, usdc: 50, label: 'Standard Bounty' },
  { points: 10000, usdc: 100, label: 'Major Delivery' },
];

export const PointsCalculatorSection: React.FC = () => {
  const [points, setPoints] = useState<number>(5000);

  const usdc = pointsToUsdc(points);

  return (
    <div className="w-full bg-[#1B1E1A] border border-[#145907] rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
      <div className="text-center max-w-xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-wider text-[#28B110] font-bold">
          Sistema Contábil Interno (Seção 5)
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
          100 Pontos = 1 USDC
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Pontos funcionam como unidade contábil interna sem valor especulativo.
          No momento do Claim, a conversão para USDC é instantânea.
        </p>
      </div>

      {/* Grid de Presets Rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PRESETS.map((preset) => {
          const isSelected = points === preset.points;
          return (
            <button
              key={preset.points}
              onClick={() => setPoints(preset.points)}
              className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1 ${
                isSelected
                  ? 'bg-[#145907]/50 border-[#28B110] shadow-lg shadow-[#145907]/40 scale-[1.02]'
                  : 'bg-black/30 border-[#145907]/50 text-slate-400 hover:border-[#28B110]/40 hover:text-white'
              }`}
            >
              <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">
                {preset.label}
              </span>
              <span className="text-base font-bold font-mono text-white">
                {preset.points.toLocaleString()} pts
              </span>
              <span className="text-xs font-mono text-[#28B110] font-semibold">
                ${preset.usdc} USDC
              </span>
            </button>
          );
        })}
      </div>

      {/* Calculadora Interativa Customizada */}
      <div className="p-5 rounded-2xl bg-black/40 border border-[#145907]/60 flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          {/* Input de Pontos */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase text-slate-400 font-semibold">
              Pontos da Recompensa
            </label>
            <div className="relative">
              <input
                type="number"
                step="100"
                min="0"
                max="50000"
                value={points}
                onChange={(e) => setPoints(Math.max(0, Number(e.target.value) || 0))}
                className="w-full bg-[#1B1E1A] border border-[#145907] rounded-xl px-4 py-2.5 text-white font-mono text-base font-bold focus:outline-none focus:border-[#28B110]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                pts
              </span>
            </div>
          </div>

          <div className="flex justify-center text-slate-600">
            <ArrowRightLeft className="w-5 h-5 text-[#28B110]" />
          </div>

          {/* Resultado em USDC */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase text-slate-400 font-semibold">
              Equivalente Líquido em USDC
            </label>
            <div className="w-full bg-[#145907]/30 border border-[#28B110]/50 rounded-xl px-4 py-2.5 text-[#D9EED6] font-mono text-base font-bold flex items-center justify-between">
              <span>${usdc.toFixed(2)} USDC</span>
              <span className="text-[10px] text-[#28B110] uppercase px-2 py-0.5 rounded bg-[#145907]/60 font-sans">
                Solana Devnet
              </span>
            </div>
          </div>
        </div>

        {/* Range Slider */}
        <div className="flex flex-col gap-1.5">
          <input
            type="range"
            min="100"
            max="25000"
            step="100"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="w-full h-1.5 bg-[#1B1E1A] rounded-lg appearance-none cursor-pointer accent-[#28B110]"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>100 pts ($1)</span>
            <span>10.000 pts ($100)</span>
            <span>25.000 pts ($250)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsCalculatorSection;
