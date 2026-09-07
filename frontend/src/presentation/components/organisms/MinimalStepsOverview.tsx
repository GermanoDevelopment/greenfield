import React from 'react';
import { GitPullRequest, GitMerge, DollarSign } from 'lucide-react';

export const MinimalStepsOverview: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Issue & Recompensa',
      desc: 'O mantenedor seleciona a issue no GitHub e define a pontuação garantida com liquidez em USDC.',
      icon: <GitPullRequest className="w-5 h-5 text-blue-600" />,
    },
    {
      num: '02',
      title: 'Merge do Pull Request',
      desc: 'O desenvolvedor submete a solução. O resgate só é liberado após o merge definitivo do código.',
      icon: <GitMerge className="w-5 h-5 text-purple-600" />,
    },
    {
      num: '03',
      title: 'Resgate Instantâneo',
      desc: 'Com um clique, a carteira Solana assina a transação e recebe o USDC direto on-chain.',
      icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
    },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="text-center max-w-xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Como Funciona
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Fluxo direto do repositório ao pagamento na blockchain.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step) => (
          <div
            key={step.num}
            className="p-6 rounded-2xl bg-white border border-[#EEF2F6] hover:border-blue-200 transition-all flex flex-col justify-between gap-4 shadow-card interactive-card group"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                {step.icon}
              </div>
              <span className="text-2xl font-black font-mono text-slate-300 group-hover:text-blue-500/40 transition-colors">
                {step.num}
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {step.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MinimalStepsOverview;
