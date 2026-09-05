import React from 'react';
import { GitPullRequest, Server, ShieldCheck, Wallet, Check } from 'lucide-react';

export const ArchitectureFlowDiagram: React.FC = () => {
  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-8">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
          Decisão Arquitetural Fundamental
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
          Separação Rigorosa de Responsabilidades
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          O backend não custodia os fundos dos desenvolvedores. O contrato inteligente na Solana
          garante a reserva do Tesouro, autoriza o Claim e impede double-claim on-chain.
        </p>
      </div>

      {/* Grid de 4 Pilares Arquiteturais Conectados */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
        {/* Pilar 1: GitHub */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-4 group hover:border-slate-700 transition-all">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Camada 01</span>
              <h4 className="text-base font-bold text-white">GitHub</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Origem natural do trabalho. Onde as issues são selecionadas e os pull requests são
              revisados e mergeados.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-900 text-[11px] text-slate-400 font-mono space-y-1">
            <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Repos & Issues</div>
            <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Pull Requests</div>
            <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Merge Event</div>
          </div>
        </div>

        {/* Pilar 2: Backend Greenfield */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-4 group hover:border-emerald-500/40 transition-all">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Camada 02</span>
              <h4 className="text-base font-bold text-white">Greenfield API</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Coordenação de estados e verificação. Recebe webhooks, valida critérios do PR e
              emite a autorização para o claim.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-900 text-[11px] text-slate-400 font-mono space-y-1">
            <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> GitHub OAuth</div>
            <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Webhook Verifier</div>
            <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-400" /> Zero Custódia</div>
          </div>
        </div>

        {/* Pilar 3: Solana Smart Contract */}
        <div className="p-6 rounded-2xl bg-purple-950/20 border border-purple-800/40 flex flex-col justify-between gap-4 group hover:border-purple-600/60 transition-all">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-purple-400 font-bold">Camada 03</span>
              <h4 className="text-base font-bold text-white">Solana Program</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Camada financeira inteligente. Guarda o Tesouro Comunitário, gerencia o Escrow USDC e
              garante que ninguém saque duas vezes.
            </p>
          </div>

          <div className="pt-3 border-t border-purple-900/40 text-[11px] text-purple-300 font-mono space-y-1">
            <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-400" /> Pool $25.000 USDC</div>
            <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-400" /> Anti Double-Claim</div>
            <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-purple-400" /> Transação On-Chain</div>
          </div>
        </div>

        {/* Pilar 4: Dev Wallet */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-4 group hover:border-teal-500/40 transition-all">
          <div className="flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-teal-400 font-bold">Camada 04</span>
              <h4 className="text-base font-bold text-white">Wallet do Dev</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Liquidação imediata. O desenvolvedor assina com sua carteira e recebe os tokens USDC
              diretamente em sua custódia.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-900 text-[11px] text-slate-400 font-mono space-y-1">
            <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-teal-400" /> Phantom / Solflare</div>
            <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-teal-400" /> USDC Real</div>
            <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-teal-400" /> Solana Explorer</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureFlowDiagram;
