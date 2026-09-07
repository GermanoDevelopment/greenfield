import React, { useState } from 'react';
import { pointsToUsdc } from '../../../core/domain/types';
import { ArrowRightLeft } from 'lucide-react';

const PRESETS = [
  { points: 500, label: 'Bug Fix' },
  { points: 1000, label: 'Minor Feature' },
  { points: 5000, label: 'Standard Bounty' },
  { points: 10000, label: 'Major Delivery' },
];

export const PointsCalculatorSection: React.FC = () => {
  const [points, setPoints] = useState<number>(5000);
  const usdc = pointsToUsdc(points);

  return (
    <div className="w-full bg-[#1B1E1A]/80 border border-[#145907]/70 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Conversor de Pontos
          </h3>
          <p className="text-xs text-slate-400">
            Regra fixa: 100 pontos = 1 USDC (sem volatilidade).
          </p>
        </div>

        {/* Presets compactos */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.points}
              onClick={() => setPoints(preset.points)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                points === preset.points
                  ? 'bg-[#145907]/60 border-[#28B110] text-[#D9EED6] font-bold'
                  : 'bg-black/30 border-[#145907]/40 text-slate-400 hover:text-white'
              }`}
            >
              {preset.points.toLocaleString()} pts
            </button>
          ))}
        </div>
      </div>

      {/* Linha de conversão com input e resultado */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center bg-black/40 p-4 rounded-xl border border-[#145907]/40">
        <div className="sm:col-span-2 relative">
          <input
            type="number"
            step="100"
            min="0"
            max="50000"
            value={points}
            onChange={(e) => setPoints(Math.max(0, Number(e.target.value) || 0))}
            className="w-full bg-[#1B1E1A] border border-[#145907] rounded-lg px-3 py-2 text-white font-mono text-sm font-bold focus:outline-none focus:border-[#28B110]"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
            pts
          </span>
        </div>

        <div className="flex justify-center text-slate-500">
          <ArrowRightLeft className="w-4 h-4 text-[#28B110]" />
        </div>

        <div className="sm:col-span-2 bg-[#145907]/30 border border-[#28B110]/40 rounded-lg px-3 py-2 text-[#D9EED6] font-mono text-sm font-bold flex items-center justify-between">
          <span>${usdc.toFixed(2)} USDC</span>
          <span className="text-[10px] text-[#28B110] uppercase">Solana Devnet</span>
        </div>
      </div>
    </div>
  );
};

export default PointsCalculatorSection;
