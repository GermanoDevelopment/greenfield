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
  const { treasury, gitHubService, createBounty, availableUsers, toggleRepositoryApproval } = useApp();

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
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRepos = async () => {
    const list = await gitHubService.listRepositories();
    setRepositories(list);
    if (list.length > 0 && !selectedRepoId) {
      setSelectedRepoId(list[0].id);
    }
  };

  useEffect(() => {
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

  const selectedRepo = repositories.find((r) => r.id === selectedRepoId);
  const selectedIssue = issues.find((i) => i.id === selectedIssueId);
  const selectedDev = availableUsers.find((u) => u.id === selectedDevId);

  const handleToggleApproval = async () => {
    if (!selectedRepo) return;
    setApprovalLoading(true);
    try {
      await toggleRepositoryApproval(selectedRepo.id, !selectedRepo.approved_for_round);
      await fetchRepos();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setApprovalLoading(false);
    }
  };

  const usdcEquivalent = pointsToUsdc(points);
  const availableTreasury = treasury ? treasury.available_usdc : 0;
  const isSolvent = availableTreasury >= usdcEquivalent;
  const remainingTreasuryAfterBounty = availableTreasury - usdcEquivalent;

  const handleNextStep = () => {
    setError(null);
    if (currentStep === 1) {
      if (!selectedRepoId || !selectedIssueId) {
        setError('Selecione um repositório e uma issue aberta antes de prosseguir.');
        return;
      }
      if (!selectedRepo?.approved_for_round) {
        setError('O repositório precisa estar aprovado para a rodada de contribuição antes de adicionar issues.');
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
      <div className="flex items-center justify-between pb-6 border-b border-[#252E24]">
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
                      ? 'bg-[#28B110] text-[#141814] shadow-sm shadow-[#28B110]/30'
                      : isActive
                      ? 'bg-[#28B110] text-[#141814] shadow-md shadow-[#28B110]/30 ring-4 ring-[#28B110]/20'
                      : 'bg-[#131A12] text-[#889887] border border-[#252E24]'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4 text-[#141814]" /> : item.step}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span
                    className={`text-xs font-bold leading-tight ${
                      isActive ? 'text-[#28B110]' : isDone ? 'text-white' : 'text-[#889887]'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span className="text-[11px] text-[#889887]">{item.desc}</span>
                </div>
              </div>

              {idx < 2 && (
                <div
                  className={`flex-1 h-0.5 mx-3 sm:mx-6 rounded ${
                    currentStep > idx + 1 ? 'bg-[#28B110]' : 'bg-[#252E24]'
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
              <h3 className="text-base font-bold text-white">
                1. Selecione a Issue no Repositório
              </h3>
              <p className="text-xs text-[#889887] mt-0.5">
                Escolha o projeto sincronizado via GitHub OAuth e a issue aberta para financiar.
              </p>
            </div>

            {/* Repositório */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#889887] flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-[#28B110]" />
                  <span>Repositório</span>
                </label>
                {selectedRepo && (
                  <span
                    className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      selectedRepo.approved_for_round
                        ? 'bg-[#28B110]/20 text-[#28B110] border border-[#28B110]/40'
                        : 'bg-amber-950/40 text-amber-300 border border-amber-800/60'
                    }`}
                  >
                    {selectedRepo.approved_for_round ? 'Aprovado para a Rodada' : 'Não Aprovado na Rodada'}
                  </span>
                )}
              </div>

              <select
                value={selectedRepoId}
                onChange={(e) => setSelectedRepoId(e.target.value)}
                className="w-full bg-[#131A12] border border-[#252E24] rounded-xl px-4 py-3 text-[#D2DFD1] text-sm font-medium focus:outline-none focus:border-[#28B110] transition-all cursor-pointer min-h-[44px]"
              >
                {repositories.map((repo) => (
                  <option key={repo.id} value={repo.id} className="bg-[#131A12] text-[#D2DFD1]">
                    {repo.owner}/{repo.name} ({repo.approved_for_round ? '✓ Rodada Ativa' : 'Pendente'})
                  </option>
                ))}
              </select>

              {/* Botão de Gestão de Aprovação do Repositório */}
              {selectedRepo && (
                <div className="p-3 rounded-xl bg-[#131A12] border border-[#252E24] flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#889887]">
                    {selectedRepo.approved_for_round
                      ? 'Este repositório está elegível para receber financiamento de issues.'
                      : 'O mantenedor precisa aprovar a inclusão deste repositório na rodada.'}
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleApproval}
                    disabled={approvalLoading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                      selectedRepo.approved_for_round
                        ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60'
                        : 'bg-[#28B110] hover:brightness-110 text-[#141814]'
                    }`}
                  >
                    {selectedRepo.approved_for_round
                      ? 'Remover da Rodada'
                      : 'Aprovar Repositório'}
                  </button>
                </div>
              )}
            </div>

            {/* Issue */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#889887] flex items-center gap-1.5">
                <CircleDot className="w-3.5 h-3.5 text-[#28B110]" />
                <span>Issue Aberta</span>
              </label>
              <select
                value={selectedIssueId}
                onChange={(e) => setSelectedIssueId(e.target.value)}
                className="w-full bg-[#131A12] border border-[#252E24] rounded-xl px-4 py-3 text-[#D2DFD1] text-sm font-medium focus:outline-none focus:border-[#28B110] transition-all cursor-pointer min-h-[44px]"
              >
                {issues.map((issue) => (
                  <option key={issue.id} value={issue.id} className="bg-[#131A12] text-[#D2DFD1]">
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
                className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-[#28B110] hover:brightness-110 text-[#141814] font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-[#28B110]/20 transition-all cursor-pointer interactive-btn"
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
              <h3 className="text-base font-bold text-white">
                2. Recompensa & Conversão USDC
              </h3>
              <p className="text-xs text-[#889887] mt-0.5">
                Defina a pontuação de esforço. O sistema calcula a garantia em USDC em tempo real.
              </p>
            </div>

            {/* Input de Pontos e Conversão */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#889887] flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-[#28B110]" />
                    <span>Pontos Greenfield</span>
                  </label>
                  <span className="text-[11px] font-mono font-semibold text-[#28B110]">
                    100 pts = 1 USDC
                  </span>
                </div>
                <input
                  type="number"
                  step="100"
                  min="100"
                  value={points}
                  onChange={(e) => setPoints(Math.max(100, Number(e.target.value) || 0))}
                  className="w-full bg-[#131A12] border border-[#252E24] rounded-xl px-4 py-3 text-white font-mono text-base font-bold focus:outline-none focus:border-[#28B110] min-h-[44px]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#889887]">
                  Garantia em USDC On-Chain
                </label>
                <div className="w-full bg-[#131A12] border border-[#28B110]/40 rounded-xl px-4 py-3 text-[#28B110] font-mono text-xl font-black flex items-center justify-between min-h-[44px]">
                  <span>${usdcEquivalent.toFixed(2)} USDC</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#28B110]/20 text-[#28B110] border border-[#28B110]/30">
                    Solana Escrow
                  </span>
                </div>
              </div>
            </div>

            {/* DESTAQUE DE SOLVÊNCIA: Box Fixo com Saldo OK / Saldo Insuficiente */}
            <div
              className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isSolvent
                  ? 'bg-[#182017] border-[#28B110]/40 text-[#D2DFD1]'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {isSolvent ? (
                  <CheckCircle2 className="w-5 h-5 text-[#28B110] shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold block">
                    Invariante 4 (Garantia de Solvência On-Chain):
                  </span>
                  <span className="text-xs opacity-90">
                    Saldo disponível no Tesouro:{' '}
                    <strong className="font-mono text-white">${availableTreasury.toFixed(2)} USDC</strong>
                    {isSolvent && (
                      <span>
                        {' '}
                        • Restará após criação:{' '}
                        <strong className="font-mono text-[#28B110]">
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
                    ? 'bg-[#28B110] text-[#141814] shadow-sm'
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
                className="min-h-[44px] px-5 py-3 rounded-xl border border-[#252E24] bg-[#131A12] hover:bg-[#20291e] text-[#D2DFD1] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={!isSolvent}
                className="min-h-[44px] px-6 py-3 rounded-xl bg-[#28B110] hover:brightness-110 disabled:bg-[#131A12] disabled:text-[#889887]/40 disabled:cursor-not-allowed text-[#141814] font-bold text-xs flex items-center gap-2 shadow-sm shadow-[#28B110]/20 transition-all cursor-pointer interactive-btn"
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
              <h3 className="text-base font-bold text-white">
                3. Atribuição & Confirmação Final
              </h3>
              <p className="text-xs text-[#889887] mt-0.5">
                Revise os termos da recompensa e assine a transação sem custódia para reservar o valor.
              </p>
            </div>

            {/* Atribuição de Desenvolvedor */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#889887] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#28B110]" />
                <span>Atribuição Direta (Opcional)</span>
              </label>
              <select
                value={selectedDevId}
                onChange={(e) => setSelectedDevId(e.target.value)}
                className="w-full bg-[#131A12] border border-[#252E24] rounded-xl px-4 py-3 text-[#D2DFD1] text-sm font-medium focus:outline-none focus:border-[#28B110] transition-all cursor-pointer min-h-[44px]"
              >
                <option value="" className="bg-[#131A12] text-[#D2DFD1]">Deixar aberto para receber propostas de desenvolvedores</option>
                {developers.map((dev) => (
                  <option key={dev.id} value={dev.id} className="bg-[#131A12] text-[#D2DFD1]">
                    @{dev.github_username} ({dev.wallet_address.slice(0, 4)}...
                    {dev.wallet_address.slice(-4)})
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-[#889887]">
                Caso deixe em aberto, a issue entrará com status <strong>Propostas Abertas</strong> e você receberá as propostas dos interessados para aprovar via API do GitHub.
              </span>
            </div>

            {/* Card de Resumo Executivo */}
            <div className="p-5 rounded-2xl bg-[#131A12] border border-[#252E24] flex flex-col gap-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#252E24]">
                <span className="text-xs font-bold uppercase text-[#889887]">
                  Resumo da Bounty
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#28B110]/20 text-[#28B110] border border-[#28B110]/30">
                  Devnet Escrow
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#889887] block">Issue:</span>
                  <span className="font-semibold text-white">
                    #{selectedIssue?.number} {selectedIssue?.title}
                  </span>
                </div>
                <div>
                  <span className="text-[#889887] block">Repositório:</span>
                  <span className="font-mono text-[#D2DFD1]">
                    {selectedRepo?.owner}/{selectedRepo?.name}
                  </span>
                </div>
                <div>
                  <span className="text-[#889887] block">Valor Garantido:</span>
                  <span className="font-bold text-[#28B110] text-sm">
                    ${usdcEquivalent} USDC ({points.toLocaleString()} pontos)
                  </span>
                </div>
                <div>
                  <span className="text-[#889887] block">Desenvolvedor:</span>
                  <span className="font-semibold text-[#D2DFD1]">
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
                className="min-h-[44px] px-5 py-3 rounded-xl border border-[#252E24] bg-[#131A12] hover:bg-[#20291e] text-[#D2DFD1] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
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
                className="flex-1 min-h-[44px] font-bold shadow-md shadow-[#28B110]/20 cursor-pointer"
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
