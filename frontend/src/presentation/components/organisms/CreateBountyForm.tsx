import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { pointsToUsdc } from '../../../core/domain/types';
import type { Issue, Repository } from '../../../core/domain/types';
import { AlertCircle, CheckCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import DesygenButton from '../atoms/DesygenButton';

export const CreateBountyForm: React.FC = () => {
  const navigate = useNavigate();
  const { treasury, gitHubService, createBounty, availableUsers } = useApp();

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
  const isSolvent = treasury ? treasury.available_usdc >= usdcEquivalent : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepoId || !selectedIssueId) {
      setError('Por favor selecione um repositório e uma issue.');
      return;
    }

    if (!isSolvent) {
      setError(
        'Invariante 4 violada: Saldo insuficiente no Tesouro Comunitário para cobrir esta recompensa.'
      );
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
      setError(err.message || 'Erro ao criar bounty.');
    } finally {
      setLoading(false);
    }
  };

  const developers = availableUsers.filter((u) => u.role === 'developer');

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* 1. Seleção de Repositório */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-200">
          1. Repositório GitHub Autorizado
        </label>
        <select
          value={selectedRepoId}
          onChange={(e) => setSelectedRepoId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          {repositories.map((repo) => (
            <option key={repo.id} value={repo.id}>
              {repo.owner}/{repo.name} ({repo.default_branch || 'main'})
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400">
          Carregado via permissões da integração GitHub OAuth do mantenedor.
        </span>
      </div>

      {/* 2. Seleção de Issue */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-200">
          2. Selecione a Issue para Recompensa
        </label>
        <select
          value={selectedIssueId}
          onChange={(e) => setSelectedIssueId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          {issues.map((issue) => (
            <option key={issue.id} value={issue.id}>
              #{issue.number} — {issue.title}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Recompensa em Pontos com Conversão em Tempo Real */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-200">
            3. Definir Recompensa em Pontos
          </label>
          <span className="text-xs font-mono text-emerald-400">100 pontos = 1 USDC</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Quantidade de Pontos</label>
            <input
              type="number"
              step="100"
              min="100"
              value={points}
              onChange={(e) => setPoints(Math.max(100, Number(e.target.value) || 0))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-base focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Equivalente em USDC</label>
            <div className="w-full bg-emerald-950/40 border border-emerald-500/40 rounded-xl px-4 py-2.5 text-emerald-300 font-mono text-lg font-bold flex items-center justify-between">
              <span>${usdcEquivalent.toFixed(2)} USDC</span>
              <span className="text-[10px] text-emerald-500 uppercase">Devnet Escrow</span>
            </div>
          </div>
        </div>

        {/* Verificação de Solvência do Tesouro (Invariante 4) */}
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            isSolvent
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {isSolvent ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>
              <strong>Invariante 4 (Solvência):</strong> Saldo disponível no Tesouro:{' '}
              <code>${treasury?.available_usdc.toFixed(2)} USDC</code>
            </span>
          </div>
          <span className="font-semibold font-mono">
            {isSolvent ? 'Saldo OK' : 'Bloqueado (Insolvente)'}
          </span>
        </div>
      </div>

      {/* 4. Atribuição opcional a um Desenvolvedor */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-200">
          4. Atribuir Desenvolvedor (Opcional no momento da criação)
        </label>
        <select
          value={selectedDevId}
          onChange={(e) => setSelectedDevId(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
        >
          <option value="">Deixar aberto para atribuição posterior</option>
          {developers.map((dev) => (
            <option key={dev.id} value={dev.id}>
              @{dev.github_username} ({dev.wallet_address.slice(0, 4)}...
              {dev.wallet_address.slice(-4)})
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400">
          <strong>Invariante 2:</strong> Assim que o desenvolvedor é atribuído, a recompensa
          torna-se imutável e não poderá ser reduzida.
        </span>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Botão de Envio */}
      <DesygenButton
        type="submit"
        variant="primary"
        size="lg"
        isLoading={loading}
        disabled={!isSolvent}
        className="w-full !py-3.5 font-bold shadow-xl shadow-emerald-950/40 cursor-pointer"
      >
        <span>Publicar Bounty & Reservar ${usdcEquivalent} USDC</span>
        <ArrowRight className="w-4 h-4" />
      </DesygenButton>
    </form>
  );
};

export default CreateBountyForm;
