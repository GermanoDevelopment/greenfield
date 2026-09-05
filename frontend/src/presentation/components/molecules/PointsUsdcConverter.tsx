import React, { useState } from 'react';
import { pointsToUsdc } from '../../../core/domain/types';
import { ArrowRightLeft } from 'lucide-react';

export const PointsUsdcConverter: React.FC = () => {
  const [points, setPoints] = useState<number>(5000);

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value) || 0;
    setPoints(Math.max(0, val));
  };

  const usdc = pointsToUsdc(points);

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold uppercase tracking-wider text-slate-300">
          Conversor de Sistema de Pontos
        </span>
        <span className="font-mono text-emerald-400">100 pts = 1 USDC</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
        <div className="sm:col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">Pontos (Unidade Contábil)</label>
          <input
            type="number"
            step="100"
            min="0"
            value={points}
            onChange={handlePointsChange}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex justify-center text-slate-500">
          <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-slate-400 mb-1 block">Recompensa Líquida (USDC)</label>
          <div className="w-full bg-emerald-950/40 border border-emerald-500/40 rounded-lg px-3 py-2 text-emerald-300 font-mono text-sm font-bold flex items-center justify-between">
            <span>${usdc.toFixed(2)}</span>
            <span className="text-xs text-emerald-500">Solana Devnet</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsUsdcConverter;
