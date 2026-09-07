import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { pointsToUsdc } from '../../../core/domain/types';
import type { Issue, Repository } from '../../../core/domain/types';
import {
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  GitBranch,
  CircleDot,
  Coins,
  User,
  Sparkles,
} from 'lucide-react';
import DesygenButton from '../atoms/DesygenButton';

export const CreateBountyForm: React.FC = () => {
  const navigate = useNavigate();
  const { treasury, gitHubService, createBounty, availableUsers } = useApp();

  // Estado do Wizard (1, 2, 3)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Campos do formulário
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string>('');
  const [points, setPoints] = useState<number>(5000);
  const [selectedDevId, setSelectedDevId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      const list = await gitHubService.listRepositories();
      setRepositories(list);
      if (list.length > 0) {
        setSelectedRepoId(list[0].id);
      }
    };
    fetchRepos();
  }, [gitHubService]);

  useEffect(() => {
    if (!selectedRepoId) return;
    const fetchIssues = async () => {
      const list = await gitHubService.listIssues(selectedRepoId);
      setIssues(list);
      if (list.length > 0) {
        setSelectedIssueId(list[0].id);
      }
    };
    fetchIssues();
  }, [selectedRepoId, gitHubService]);

  const usdcEquivalent = pointsToUsdc(points);
  const availableTreasury = treasury ? treasury.available_usdc : 0;
  const isSolvent = availableTreasury >= usdcEquivalent;
  const remainingTreasuryAfterBounty = availableTreasury - usdcEquivalent;

  const selectedRepo = repositories.find((r) => r.id === selectedRepoId);
  const selectedIssue = issues.find((i) => i.id === selectedIssueId);
  const selectedDev = availableUsers.find((u) => u.id === selectedDevId);

  const handleNextStep = () => {
    setError(null);
    if (currentStep === 1) {
      if (!selectedRepoId || !selectedIssueId) {
        setError('Selecione um repositório e uma issue aberta antes de prosseguir.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (points < 100) {
        setError('O valor mínimo de recompensa é de 100 pontos (1 USDC).');
        return;
      }
      if (!isSolvent) {
        setError('Invariante 4 violada: O tesouro comunitário não possui saldo suficiente.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    if (currentStep === 3) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepoId || !selectedIssueId) {
      setError('Por favor selecione um repositório e uma issue.');
      return;
    }

    if (!isSolvent) {
      setError('Saldo insuficiente no Tesouro Comunitário para cobrir esta recompensa.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const bounty = await createBounty({
        repositoryId: selectedRepoId,
        issueId: selectedIssueId,
        points,
        developerId: selectedDevId || undefined,
      });
      navigate(`/bounties/${bounty.id}`);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar bounty on-chain.');
    } finally {
      setLoading(false);
    }
  };

  const developers = availableUsers.filter((u) => u.role === 'developer');

  return (
    <div className="flex flex-col gap-6">
      {/* 1. INDICADOR VISUAL DE ETAPAS (1 de 3, 2 de 3, 3 de 3) */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-100">
        {[
          { step: 1, label: 'Issue', desc: 'Repositório & Tarefa' },
          { step: 2, label: 'Recompensa', desc: 'Pontos & Solvência' },
          { step: 3, label: 'Atribuição', desc: 'Dev & Confirmação' },
        ].map((item, idx) => {
          const isActive = currentStep === item.step;
          const isDone = currentStep > item.step;

          return (
            <div key={item.step} className="flex items-center flex-1 last:flex-initial">
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                    isDone
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                      : isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-50'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span
                    className={`text-xs font-bold leading-tight ${
                      isActive ? 'text-blue-600' : isDone ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="text-[11px] text-slate-400">{item.desc}</span>
                </div>
              </div>

              {idx < 2 && (
                <div
                  className={`flex-1 h-0.5 mx-3 sm:mx-6 rounded ${
                    currentStep > idx + 1 ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* ================= ETAPA 1: ISSUE ================= */}
        {currentStep === 1 && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                1. Selecione a Issue no Repositório
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Escolha o projeto sincronizado via GitHub OAuth e a issue aberta para financiar.
              </p>
            </div>

            {/* Repositório */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                <span>Repositório Autorizado</span>
              </label>
              <select
                value={selectedRepoId}
                onChange={(e) => setSelectedRepoId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-h-[44px]"
              >
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.owner}/{repo.name} ({repo.default_branch || 'main'})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400">
                Apenas repositórios nos quais você possui permissão de escrita/administração.
              </span>
            </div>

            {/* Issue */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <CircleDot className="w-3.5 h-3.5 text-emerald-600" />
                <span>Issue Aberta</span>
              </label>
              <select
                value={selectedIssueId}
                onChange={(e) => setSelectedIssueId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-h-[44px]"
              >
                {issues.map((issue) => (
                  <option key={issue.id} value={issue.id}>
                    #{issue.number} — {issue.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Botão Avançar Etapa 1 */}
            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer interactive-btn"
              >
                <span>Definir Recompensa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= ETAPA 2: VALOR & SOLVÊNCIA ================= */}
        {currentStep === 2 && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                2. Recompensa & Conversão USDC
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina a pontuação de esforço. O sistema calcula a garantia em USDC em tempo real.
              </p>
            </div>

            {/* Input de Pontos e Conversão */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pontos Greenfield</span>
                  </label>
                  <span className="text-[11px] font-mono font-semibold text-blue-600">
                    100 pts = 1 USDC
                  </span>
                </div>
                <input
                  type="number"
                  step="100"
                  min="100"
                  value={points}
                  onChange={(e) => setPoints(Math.max(100, Number(e.target.value) || 0))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 font-mono text-base font-bold focus:outline-none focus:border-blue-500 focus:bg-white min-h-[44px]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Garantia em USDC On-Chain
                </label>
                <div className="w-full bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-blue-700 font-mono text-xl font-black flex items-center justify-between min-h-[44px]">
                  <span>${usdcEquivalent.toFixed(2)} USDC</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Solana Escrow
                  </span>
                </div>
              </div>
            </div>

            {/* DESTAQUE DE SOLVÊNCIA: Box Fixo com Saldo OK / Saldo Insuficiente */}
            <div
              className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isSolvent
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-800'
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {isSolvent ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">
                    Invariante 4 (Garantia de Solvência On-Chain):
                  </span>
                  <span className="text-xs opacity-90">
                    Saldo disponível no Tesouro:{' '}
                    <strong className="font-mono">${availableTreasury.toFixed(2)} USDC</strong>
                    {isSolvent && (
                      <span>
                        {' '}
                        • Restará após criação:{' '}
                        <strong className="font-mono">
                          ${remainingTreasuryAfterBounty.toFixed(2)} USDC
                        </strong>
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <span
                className={`font-mono text-xs font-black uppercase px-3 py-1.5 rounded-lg shrink-0 text-center ${
                  isSolvent
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-rose-600 text-white shadow-sm'
                }`}
              >
                {isSolvent ? 'Saldo OK' : 'Saldo Insuficiente'}
              </span>
            </div>

            {/* Ações Etapa 2 */}
            <div className="pt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrevStep}
                className="min-h-[44px] px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={!isSolvent}
                className="min-h-[44px] px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer interactive-btn"
              >
                <span>Avançar para Atribuição</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= ETAPA 3: ATRIBUIÇÃO & CONFIRMAÇÃO ================= */}
        {currentStep === 3 && (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                3. Atribuição & Confirmação Final
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Revise os termos da recompensa e assine a transação sem custódia para reservar o valor.
              </p>
            </div>

            {/* Atribuição de Desenvolvedor */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Atribuir Desenvolvedor (Opcional)</span>
              </label>
              <select
                value={selectedDevId}
                onChange={(e) => setSelectedDevId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer min-h-[44px]"
              >
                <option value="">Deixar aberto para atribuição posterior</option>
                {developers.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    @{dev.github_username} ({dev.wallet_address.slice(0, 4)}...
                    {dev.wallet_address.slice(-4)})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400">
                <strong>Invariante 2:</strong> Assim que atribuído, o valor torna-se imutável e só poderá ser resgatado após o PR mergeado.
              </span>
            </div>

            {/* Card de Resumo Executivo */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold uppercase text-slate-500">
                  Resumo da Bounty
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  Devnet Escrow
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Issue:</span>
                  <span className="font-semibold text-slate-900">
                    #{selectedIssue?.number} {selectedIssue?.title}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Repositório:</span>
                  <span className="font-mono text-slate-700">
                    {selectedRepo?.owner}/{selectedRepo?.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Valor Garantido:</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    ${usdcEquivalent} USDC ({points.toLocaleString()} pontos)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Desenvolvedor:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedDev ? `@${selectedDev.github_username}` : 'Em aberto'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações Etapa 3 */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={loading}
                className="min-h-[44px] px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <DesygenButton
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                disabled={!isSolvent}
                className="flex-1 min-h-[44px] font-bold shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Publicar Bounty & Reservar ${usdcEquivalent} USDC</span>
              </DesygenButton>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateBountyForm;
