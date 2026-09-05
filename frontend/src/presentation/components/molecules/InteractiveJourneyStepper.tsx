import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  Lock,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Play,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import StatusBadge from '../atoms/StatusBadge';
import PointsBadge from '../atoms/PointsBadge';
import UsdcBadge from '../atoms/UsdcBadge';
import type { BountyStatus } from '../../../core/domain/types';

interface StepDetail {
  step: number;
  title: string;
  shortLabel: string;
  status: BountyStatus;
  githubAction: string;
  backendAction: string;
  solanaAction: string;
  description: string;
  invariantNote: string;
  badgeColor: string;
}

const JOURNEY_STEPS: StepDetail[] = [
  {
    step: 1,
    title: 'Criação & Financiamento da Issue',
    shortLabel: '1. Issue Financiada',
    status: 'FUNDED',
    githubAction: 'Mantenedor seleciona Issue #123 no repositório GitHub',
    backendAction: 'Cria registro da bounty com 5.000 pontos contábeis',
    solanaAction: 'Verifica solvência do Tesouro e reserva $50 USDC do pool',
    description:
      'O mantenedor conecta sua conta GitHub e wallet Solana, seleciona uma issue aberta e define a recompensa. O sistema trava a liquidez necessária no tesouro.',
    invariantNote: 'Invariante 4 (Solvência): Criação bloqueada se a recompensa exceder o saldo disponível.',
    badgeColor: 'emerald',
  },
  {
    step: 2,
    title: 'Atribuição ao Desenvolvedor',
    shortLabel: '2. Dev Atribuído',
    status: 'ASSIGNED',
    githubAction: 'Issue atribuída ao desenvolvedor @alice-dev',
    backendAction: 'Registra desenvolvedor responsável e timestamp de aceitação',
    solanaAction: 'Vincula chave pública da carteira de @alice-dev para futuro saque',
    description:
      'Assim que a contribuição é atribuída e aceita pela desenvolvedora, o acordo é selado. A recompensa não pode mais sofrer reduções unilaterais.',
    invariantNote: 'Invariante 2 (Valor Imutável): Após a aceitação, valor_inicial == valor_final.',
    badgeColor: 'sky',
  },
  {
    step: 3,
    title: 'Abertura de Pull Request',
    shortLabel: '3. PR Aberto',
    status: 'PR_OPEN',
    githubAction: '@alice-dev abre Pull Request #42 vinculando "Fixes #123"',
    backendAction: 'Webhook detecta PR, valida autor e atualiza esteira',
    solanaAction: 'Fundos permanecem estritamente bloqueados em custódia',
    description:
      'A desenvolvedora envia o código para revisão. Diferente de outros sistemas, abrir o PR NÃO libera fundos antecipadamente.',
    invariantNote: 'Invariante 1 (Merge Obrigatório): PR aberto ≠ recompensa liberada. Dinheiro continua retido.',
    badgeColor: 'purple',
  },
  {
    step: 4,
    title: 'Merge Confirmado pelo Mantenedor',
    shortLabel: '4. Merge Executado',
    status: 'CLAIMABLE',
    githubAction: 'Mantenedor revisa código e clica em "Merge Pull Request"',
    backendAction: 'Webhook confirma merge no branch principal e autoriza Claim',
    solanaAction: 'Smart Contract autoriza saque imediato de $50 USDC para a wallet da dev',
    description:
      'O merge é o gatilho de validação indispensável. Somente após a integração definitiva do código o status transiciona para CLAIMABLE.',
    invariantNote: 'Invariante 1 (Gatilho de Validação): Somente o merge efetivo torna a recompensa resgatável.',
    badgeColor: 'emerald',
  },
  {
    step: 5,
    title: 'Claim On-Chain & Liquidação Instantânea',
    shortLabel: '5. Claim USDC',
    status: 'CLAIMED',
    githubAction: 'Issue #123 fechada automaticamente pelo merge',
    backendAction: 'Registra comprovante imutável com hash da transação',
    solanaAction: 'Transação USDC executada na Solana Devnet com prevenção de double-claim',
    description:
      'A desenvolvedora clica em CLAIM $50 USDC, assina em sua carteira Solana e o pagamento chega instantaneamente. O comprovante fica disponível no Solana Explorer.',
    invariantNote: 'Invariante 3 (Anti Double-Claim): claimed == true gravado on-chain; novos saques são rejeitados.',
    badgeColor: 'teal',
  },
];

export const InteractiveJourneyStepper: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % JOURNEY_STEPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const activeStep = JOURNEY_STEPS[currentStepIndex];

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm flex flex-col gap-6">
      {/* Header do Simulador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" /> SIMULADOR INTERATIVO DO FLUXO CANÔNICO
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Como o Greenfield Funciona na Prática
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Clique nos passos abaixo ou ative a reprodução automática para acompanhar a esteira.
          </p>
        </div>

        {/* Botão de Auto-Play */}
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isAutoPlaying
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          {isAutoPlaying ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Pausar Demonstração</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Auto-Play (15s)</span>
            </>
          )}
        </button>
      </div>

      {/* Navegador de Passos (Pills Clicáveis) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {JOURNEY_STEPS.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isPassed = idx < currentStepIndex;

          return (
            <button
              key={step.step}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentStepIndex(idx);
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                isActive
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/40 scale-[1.02]'
                  : isPassed
                  ? 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  : 'bg-slate-950/30 border-slate-850 text-slate-500 hover:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                  Etapa 0{step.step}
                </span>
                {isPassed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-xs font-bold line-clamp-1 ${
                  isActive ? 'text-white' : isPassed ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {step.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cartão de Detalhes da Etapa Ativa */}
      <div className="p-6 sm:p-7 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black font-mono text-lg">
              0{activeStep.step}
            </div>
            <div>
              <h4 className="text-lg font-bold text-white tracking-tight">
                {activeStep.title}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">{activeStep.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={activeStep.status} size="md" />
            <PointsBadge points={5000} size="sm" />
            <UsdcBadge amount={50} size="sm" />
          </div>
        </div>

        {/* 3 Camadas de Ação: GitHub, Backend Greenfield, Solana Smart Contract */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          {/* GitHub Layer */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-[10px]">
              <GitPullRequest className="w-3.5 h-3.5 text-slate-300" />
              <span>Camada GitHub</span>
            </div>
            <p className="text-slate-200 font-sans text-xs">{activeStep.githubAction}</p>
          </div>

          {/* Backend Layer */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[10px]">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Greenfield API</span>
            </div>
            <p className="text-slate-200 font-sans text-xs">{activeStep.backendAction}</p>
          </div>

          {/* Solana Layer */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-purple-400 font-bold uppercase text-[10px]">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Solana Program</span>
            </div>
            <p className="text-purple-200 font-sans text-xs">{activeStep.solanaAction}</p>
          </div>
        </div>

        {/* Invariante em Destaque */}
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{activeStep.invariantNote}</span>
          </div>

          {activeStep.step === 5 && (
            <a
              href="https://explorer.solana.com/address/7XwK1q7e8xN6M9Z4P3Q2R1S5T8U7V4W3X2Y1Z9A8B7C6?cluster=devnet"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <span>Ver no Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Controles de Navegação */}
      <div className="flex items-center justify-between pt-1">
        <button
          disabled={currentStepIndex === 0}
          onClick={() => {
            setIsAutoPlaying(false);
            setCurrentStepIndex((prev) => Math.max(0, prev - 1));
          }}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          ← Etapa Anterior
        </button>

        <div className="flex items-center gap-1.5">
          {JOURNEY_STEPS.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentStepIndex ? 'w-6 bg-emerald-400' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <button
          disabled={currentStepIndex === JOURNEY_STEPS.length - 1}
          onClick={() => {
            setIsAutoPlaying(false);
            setCurrentStepIndex((prev) => Math.min(JOURNEY_STEPS.length - 1, prev + 1));
          }}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <span>Próxima Etapa</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default InteractiveJourneyStepper;
