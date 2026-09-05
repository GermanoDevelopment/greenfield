import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BountyStateStepper from '../components/molecules/BountyStateStepper';
import StatusBadge from '../components/atoms/StatusBadge';
import PointsBadge from '../components/atoms/PointsBadge';
import SolanaAddressPill from '../components/atoms/SolanaAddressPill';
import ClaimModal from '../components/organisms/ClaimModal';
import DesygenButton from '../components/atoms/DesygenButton';
import {
  ArrowLeft,
  ExternalLink,
  GitPullRequest,
  GitMerge,
  Sparkles,
  Shield,
  Code2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const BountyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    bounties,
    currentUser,
    assignDeveloper,
    openPullRequest,
    mergePullRequest,
    solanaService,
  } = useApp();

  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const bounty = bounties.find((b) => b.id === id);

  if (!bounty) {
    return (
      <div className="text-center py-16 flex flex-col items-center gap-4">
        <h2 className="text-xl font-bold text-white">Bounty não encontrada</h2>
        <Link to="/dashboard">
          <DesygenButton variant="secondary" size="md">
            Voltar ao Dashboard
          </DesygenButton>
        </Link>
      </div>
    );
  }

  // Ações de Simulação do Ciclo de Vida para a Demonstração (Happy Path)
  const handleAssignToMe = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await assignDeveloper(bounty.id, currentUser.id);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPr = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const prNumber = Math.floor(Math.random() * 80) + 20;
      await openPullRequest(bounty.id, {
        github_pr_id: Date.now(),
        number: prNumber,
        title: `feat: resolve issue #${bounty.issue?.number} with verified implementation`,
        url: `https://github.com/${bounty.repository?.owner}/${bounty.repository?.name}/pull/${prNumber}`,
        author_github_username: currentUser.github_username,
      });
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMergePr = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await mergePullRequest(bounty.id);
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Dashboard</span>
        </Link>

        <div className="flex items-center gap-2">
          <StatusBadge status={bounty.status} />
        </div>
      </div>

      {/* Header Principal da Bounty */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span>{bounty.repository?.owner}/{bounty.repository?.name}</span>
            <span>•</span>
            <span>Issue #{bounty.issue?.number}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {bounty.issue?.title}
          </h1>

          <p className="text-sm text-slate-400 mt-2 max-w-2xl">
            {bounty.issue?.description || 'Implementação de contribuição técnica para o ecossistema Solana.'}
          </p>

          <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
            <a
              href={bounty.issue?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-400 hover:underline"
            >
              <span>Ver no GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <span>Criada em: {new Date(bounty.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Card de Recompensa */}
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center text-center shrink-0 min-w-[220px]">
          <span className="text-xs uppercase font-mono text-slate-400">Recompensa Garantida</span>
          <div className="text-3xl font-extrabold font-mono text-white mt-1">
            ${bounty.usdc_amount} <span className="text-emerald-400 text-xl">USDC</span>
          </div>
          <div className="mt-2">
            <PointsBadge points={bounty.points} size="sm" />
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-2">
            Invariante 2: Valor Imutável
          </span>
        </div>
      </div>

      {/* Stepper da Máquina de Estados */}
      <BountyStateStepper currentStatus={bounty.status} />

      {/* Painel de Participantes & Estado do PR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Participantes */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Atores da Bounty
          </h3>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs text-slate-400 block">Mantenedor</span>
                <strong className="text-sm text-white">@{bounty.maintainer?.github_username}</strong>
              </div>
            </div>
            <SolanaAddressPill address={bounty.maintainer?.wallet_address || ''} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Code2 className="w-4 h-4 text-sky-400" />
              <div>
                <span className="text-xs text-slate-400 block">Desenvolvedor Atribuído</span>
                {bounty.developer ? (
                  <strong className="text-sm text-white">@{bounty.developer.github_username}</strong>
                ) : (
                  <span className="text-xs text-slate-500 italic">Nenhum dev atribuído</span>
                )}
              </div>
            </div>
            {bounty.developer && (
              <SolanaAddressPill address={bounty.developer.wallet_address} />
            )}
          </div>
        </div>

        {/* Integração Pull Request & Merge */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Status do Pull Request
            </h3>

            {bounty.pr ? (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4 text-purple-400" />
                    <span className="font-mono text-sm font-bold text-white">
                      PR #{bounty.pr.number}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                      bounty.pr.merged
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/50'
                        : 'bg-purple-950 text-purple-300 border border-purple-700/50'
                    }`}
                  >
                    {bounty.pr.merged ? 'MERGED' : 'OPEN'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-1">{bounty.pr.title}</p>

                <a
                  href={bounty.pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:underline inline-flex items-center gap-1 mt-1"
                >
                  <span>Abrir PR no GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-850 text-center text-xs text-slate-400">
                Nenhum Pull Request associado ainda.
              </div>
            )}
          </div>

          {/* Invariante 1 Warning */}
          <div className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-lg border border-slate-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Invariante 1:</strong> O pagamento só é liberado para Claim quando o mantenedor
              efetuar o merge do PR.
            </span>
          </div>
        </div>
      </div>

      {/* Seção de Demonstração / Simulador do Ciclo de Vida */}
      <div className="p-6 rounded-2xl bg-slate-900 border-2 border-emerald-500/30 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Painel Interativo de Demonstração do MVP (Happy Path)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Ações disponíveis para o estado: <strong>{bounty.status}</strong>
          </span>
        </div>

        {actionError && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {actionError}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* 1. Atribuir Dev (se FUNDED) */}
          {bounty.status === 'FUNDED' && (
            <DesygenButton
              variant="primary"
              size="md"
              isLoading={actionLoading}
              onClick={handleAssignToMe}
            >
              Atribuir para Mim (@{currentUser.github_username})
            </DesygenButton>
          )}

          {/* 2. Abrir PR (se ASSIGNED ou IN_PROGRESS) */}
          {(bounty.status === 'ASSIGNED' || bounty.status === 'IN_PROGRESS') && (
            <DesygenButton
              variant="primary"
              size="md"
              isLoading={actionLoading}
              onClick={handleOpenPr}
              icon={<GitPullRequest className="w-4 h-4" />}
            >
              Simular Abertura de Pull Request no GitHub
            </DesygenButton>
          )}

          {/* 3. Fazer o Merge (se PR_OPEN) */}
          {bounty.status === 'PR_OPEN' && (
            <DesygenButton
              variant="primary"
              size="md"
              isLoading={actionLoading}
              onClick={handleMergePr}
              icon={<GitMerge className="w-4 h-4" />}
            >
              Simular Merge do PR pelo Mantenedor (Gatilho de Validação)
            </DesygenButton>
          )}

          {/* 4. Realizar o Claim (se CLAIMABLE) */}
          {bounty.status === 'CLAIMABLE' && (
            <button
              onClick={() => setIsClaimModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-base flex items-center gap-2 shadow-xl shadow-emerald-500/20 hover:scale-105 transition-all cursor-pointer animate-pulse"
            >
              <Sparkles className="w-5 h-5" />
              <span>CLAIM ${bounty.usdc_amount} USDC</span>
            </button>
          )}

          {/* 5. Concluído (CLAIMED) */}
          {bounty.status === 'CLAIMED' && bounty.claim && (
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-teal-950/40 border border-teal-700/50">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-teal-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-white">Recompensa Totalmente Liquidada</h4>
                  <span className="text-xs text-slate-300 font-mono">
                    Assinatura: {bounty.claim.transaction_signature.slice(0, 24)}...
                  </span>
                </div>
              </div>

              <a
                href={solanaService.getExplorerUrl(bounty.claim.transaction_signature)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shrink-0"
              >
                <span>Ver no Solana Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Claim */}
      {isClaimModalOpen && (
        <ClaimModal bounty={bounty} onClose={() => setIsClaimModalOpen(false)} />
      )}
    </div>
  );
};

export default BountyDetailsPage;
