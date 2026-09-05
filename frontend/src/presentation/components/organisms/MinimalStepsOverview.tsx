import React from 'react';
import { GitPullRequest, GitMerge, DollarSign, ShieldCheck } from 'lucide-react';

export const MinimalStepsOverview: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Issue & Recompensa',
      subtitle: 'Definição e Reserva',
      desc: 'O mantenedor seleciona a issue no GitHub e define a recompensa contábil. A liquidez correspondente é reservada do Tesouro Comunitário ($25k USDC).',
      badge: 'Invariante 2: Valor Imutável',
      icon: <GitPullRequest className="w-6 h-6 text-[#28B110]" />,
    },
    {
      num: '02',
      title: 'Merge Obrigatório',
      subtitle: 'Gatilho de Validação',
      desc: 'O desenvolvedor abre o Pull Request. Pela Invariante 1, abrir o PR não libera pagamento. Somente o Merge definitivo torna a bounty CLAIMABLE.',
      badge: 'Invariante 1: Merge = Saque',
      icon: <GitMerge className="w-6 h-6 text-[#D9EED6]" />,
    },
    {
      num: '03',
      title: 'Claim On-Chain',
      subtitle: 'Liquidação Instantânea',
      desc: 'Com 1 clique em CLAIM, a carteira Solana (Phantom/Solflare) assina a transação. O USDC chega na wallet com prevenção de double-claim.',
      badge: 'Invariante 3: Anti Double-Claim',
      icon: <DollarSign className="w-6 h-6 text-[#28B110]" />,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-wider text-[#28B110] font-bold">
          Fluxo Canônico Simples
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
          Como Funciona o Greenfield
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          Três etapas essenciais que unem o desenvolvimento no GitHub ao pagamento direto na Solana.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step) => (
          <div
            key={step.num}
            className="p-7 rounded-3xl bg-[#1B1E1A] border border-[#145907] hover:border-[#28B110]/50 transition-all flex flex-col justify-between gap-6 shadow-xl relative group"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#145907]/40 border border-[#28B110]/30 flex items-center justify-center">
                  {step.icon}
                </div>
                <span className="text-3xl font-black font-mono text-[#145907] group-hover:text-[#28B110]/40 transition-colors">
                  {step.num}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-[#28B110] font-bold tracking-wider">
                  {step.subtitle}
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                  {step.title}
                </h3>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {step.desc}
              </p>
            </div>

            <div className="pt-4 border-t border-[#145907]/60 flex items-center gap-2 text-[11px] font-mono text-[#D9EED6]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#28B110]" />
              <span>{step.badge}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MinimalStepsOverview;
