import React from 'react';
import type { BountyStatus } from '../../../core/domain/types';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface BountyStateStepperProps {
  currentStatus: BountyStatus;
}

const PRIMARY_STEPS: { status: BountyStatus; label: string; desc: string }[] = [
  { status: 'OPEN_FOR_PROPOSALS', label: '1. Propostas', desc: 'Devs submetem propostas' },
  { status: 'ASSIGNED', label: '2. Atribuído', desc: 'Atribuição via GitHub API' },
  { status: 'IN_PROGRESS', label: '3. Em Curso', desc: 'Desenvolvimento' },
  { status: 'PR_OPEN', label: '4. PR Aberto', desc: 'Aguardando revisão' },
  { status: 'MERGED', label: '5. Merge', desc: 'Merge pelo mantenedor' },
  { status: 'CLAIMED', label: '6. Pago', desc: 'USDC liquidado via Solana' },
];

export const BountyStateStepper: React.FC<BountyStateStepperProps> = ({ currentStatus }) => {
  const isException = ['CANCELLED', 'EXPIRED', 'VERIFICATION_FAILED', 'CLAIM_FAILED'].includes(
    currentStatus
  );

  const currentIndex = PRIMARY_STEPS.findIndex((s) => s.status === currentStatus);

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          Máquina de Estados da Bounty
        </h4>
        <span className="text-xs text-slate-400 font-mono">
          Status atual:{' '}
          <strong className={currentStatus === 'CLAIMABLE' ? 'text-emerald-400' : 'text-white'}>
            {currentStatus}
          </strong>
        </span>
      </div>

      {isException ? (
        <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm">
          Estado de Exceção: <strong>{currentStatus}</strong>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {PRIMARY_STEPS.map((step, idx) => {
            const isCompleted = currentIndex > idx;
            const isCurrent = currentIndex === idx;

            let borderColor = 'border-slate-800';
            let bgColor = 'bg-slate-950/50';
            let textColor = 'text-slate-500';

            if (isCompleted) {
              borderColor = 'border-emerald-700/60';
              bgColor = 'bg-emerald-950/20';
              textColor = 'text-emerald-400';
            } else if (isCurrent) {
              borderColor = 'border-emerald-500';
              bgColor = 'bg-emerald-900/30';
              textColor = 'text-white';
            }

            return (
              <div
                key={step.status}
                className={`p-2.5 rounded-lg border flex flex-col justify-between transition-all ${borderColor} ${bgColor}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-semibold uppercase text-slate-400">
                    {step.label}
                  </span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isCurrent ? (
                    <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-700" />
                  )}
                </div>
                <span className={`text-xs font-medium truncate ${textColor}`}>
                  {step.desc}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
        <span className="font-semibold text-emerald-400">Fluxo automatizado:</span>
        <span>
          O desenvolvedor submete a proposta, o mantenedor atribui via API do GitHub e, após o <strong>Merge</strong> do PR, a plataforma liquida o pagamento em USDC diretamente na wallet Solana.
        </span>
      </div>
    </div>
  );
};

export default BountyStateStepper;
