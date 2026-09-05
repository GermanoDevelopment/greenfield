import React from 'react';
import type { BountyStatus } from '../../../core/domain/types';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface BountyStateStepperProps {
  currentStatus: BountyStatus;
}

const PRIMARY_STEPS: { status: BountyStatus; label: string; desc: string }[] = [
  { status: 'DRAFT', label: '1. Criação', desc: 'Issue selecionada' },
  { status: 'FUNDED', label: '2. Funded', desc: 'Tesouro reservado' },
  { status: 'ASSIGNED', label: '3. Assigned', desc: 'Dev atribuído (valor imutável)' },
  { status: 'IN_PROGRESS', label: '4. In Progress', desc: 'Desenvolvimento' },
  { status: 'PR_OPEN', label: '5. PR Open', desc: 'PR aberto' },
  { status: 'MERGED', label: '6. Merged', desc: 'Merge confirmado' },
  { status: 'CLAIMABLE', label: '7. Claimable', desc: 'Pronto para saque' },
  { status: 'CLAIMED', label: '8. Claimed', desc: 'USDC na wallet' },
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
        <span className="font-semibold text-emerald-400">Regra de ouro:</span>
        <span>
          Apenas o <strong>Merge</strong> do PR libera a transição para <code>CLAIMABLE</code>.
          Abrir o PR não liquida recompensa.
        </span>
      </div>
    </div>
  );
};

export default BountyStateStepper;
