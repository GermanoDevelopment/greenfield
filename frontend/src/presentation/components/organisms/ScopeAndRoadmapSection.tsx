import React from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export const ScopeAndRoadmapSection: React.FC = () => {
  const excludedFromMvp = [
    'Sem token próprio ou especulação',
    'Sem governança DAO complexa',
    'Sem marketplace aberto não supervisionado',
    'Sem IA de classificação de código',
    'Sem custódia de fundos pelo backend',
    'Sem ranking ou sistema avançado de reputação',
  ];

  const roadmapPhases = [
    {
      phase: 'MVP (Versão Atual)',
      status: 'Entregue / Em Validação',
      desc: 'Provar que o ciclo Issue → PR → Merge → Claim → USDC funciona sem fricção.',
      active: true,
    },
    {
      phase: 'V2 — Reputação',
      status: 'Próxima Fase',
      desc: 'Métricas separadas de reputação técnica de código e reputação econômica.',
      active: false,
    },
    {
      phase: 'V3 — Bounties Abertas',
      status: 'Planejado',
      desc: 'Vários desenvolvedores concorrendo; recompensa liberada para o primeiro PR válido.',
      active: false,
    },
    {
      phase: 'V6 — Multi-Patrocinadores',
      status: 'Visão Futura',
      desc: 'Pool compartilhado entre Superteam, Fundações e DAOs financiando o ecossistema.',
      active: false,
    },
  ];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* O que NÃO construir no MVP (Seção 15) */}
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-amber-400 font-bold mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Foco Absoluto (Seção 15)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            O que Deliberadamente Ficou Fora do MVP
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Para garantir que o núcleo financeiro funcione com robustez e segurança, evitamos
            complexidades desnecessárias no primeiro estágio.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {excludedFromMvp.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-950/70 border border-slate-850 text-xs text-slate-400 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-300 font-mono">
          <strong className="text-emerald-400">Princípio de Produto:</strong> Conseguimos transformar
          uma contribuição real no GitHub em USDC na wallet do desenvolvedor, de maneira verificável,
          automática e sem double-claim?
        </div>
      </div>

      {/* Roadmap Futuro (Seção 16) */}
      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-400 font-bold mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Evolução do Protocolo (Seção 16)</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Roadmap do Ecossistema
          </h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            A arquitetura foi projetada para escalar de forma modular à medida que o ecossistema de
            desenvolvedores da Solana se expande.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {roadmapPhases.map((phase, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                phase.active
                  ? 'bg-emerald-950/30 border-emerald-500/60 shadow-sm'
                  : 'bg-slate-950/60 border-slate-850 opacity-75'
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold ${
                      phase.active ? 'text-emerald-300' : 'text-white'
                    }`}
                  >
                    {phase.phase}
                  </span>
                  {phase.active && (
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">{phase.desc}</p>
              </div>

              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                {phase.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScopeAndRoadmapSection;
