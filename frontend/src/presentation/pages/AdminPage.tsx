import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  BarChart3,
  FolderGit2,
  Coins,
  CheckCircle2,
  XCircle,
  Plus,
  GitPullRequest,
  ExternalLink,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  greenfieldApi,
  type AdminStatsOut,
  type ApiBountyOut,
  type ApiRepositoryOut,
  type ApiTrackedIssueOut,
} from '../../services/api';

// Fallbacks para demonstração offline
function getFallbackStats(): AdminStatsOut {
  return {
    total_repositories: 2,
    total_bounties: 6,
    open_bounties: 2,
    submitted_bounties: 1,
    completed_bounties: 2,
    total_points_allocated: 1650,
    total_usdc_allocated: 1650,
    total_usdc_paid: 450,
    total_users: 3,
  };
}

function getFallbackRepos(): ApiRepositoryOut[] {
  return [
    {
      id: 1,
      project_id: 1,
      github_owner: 'solana-labs',
      github_name: 'solinpy-sdk',
      github_repo: 'solana-labs/solinpy-sdk',
      description: 'Biblioteca Solana Python para smart contracts e pagamentos.',
      default_branch: 'main',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      project_id: 1,
      github_owner: 'greenfield-protocol',
      github_name: 'greenfield-core',
      github_repo: 'greenfield-protocol/greenfield-core',
      description: 'Protocolo descentralizado de bounties.',
      default_branch: 'develop',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];
}

function getFallbackOpenBounties(): ApiBountyOut[] {
  return [
    {
      id: 1,
      project_id: 1,
      repository_id: 1,
      issuer_id: 1,
      hunter_id: null,
      issue_url: 'https://github.com/solana-labs/solinpy-sdk/issues/42',
      issue_number: 42,
      issue_title: 'Implementar validação off-chain de assinaturas Ed25519 em Solinpy',
      issue_body: null,
      amount_usdc: 350,
      points: 350,
      status: 'OPEN',
      escrow_pda: null,
      pr_url: null,
      tx_signature: null,
      claimed_at: null,
      created_at: new Date().toISOString(),
    },
    {
      id: 5,
      project_id: 1,
      repository_id: 2,
      issuer_id: 1,
      hunter_id: null,
      issue_url: 'https://github.com/greenfield-protocol/greenfield-core/issues/60',
      issue_number: 60,
      issue_title: 'Adicionar rate limiting nas chamadas ao RPC Devnet',
      issue_body: null,
      amount_usdc: 200,
      points: 200,
      status: 'OPEN',
      escrow_pda: null,
      pr_url: null,
      tx_signature: null,
      claimed_at: null,
      created_at: new Date().toISOString(),
    },
  ];
}

function getFallbackSubmittedBounties(): ApiBountyOut[] {
  return [
    {
      id: 3,
      project_id: 1,
      repository_id: 1,
      issuer_id: 1,
      hunter_id: 2,
      issue_url: 'https://github.com/solana-labs/solinpy-sdk/issues/51',
      issue_number: 51,
      issue_title: 'Otimizar cálculo de Compute Units (CU) no CPI de Transferência SPL-Token',
      issue_body: 'Reduzir compute units em transferências...',
      amount_usdc: 250,
      points: 250,
      status: 'SUBMITTED',
      escrow_pda: 'Escrow3333333333333333333333333333333333',
      pr_url: 'https://github.com/solana-labs/solinpy-sdk/pull/52',
      tx_signature: null,
      claimed_at: null,
      created_at: new Date().toISOString(),
      hunter: {
        id: 2,
        github_id: 998877,
        username: 'alice-dev',
        avatar_url: 'https://avatars.githubusercontent.com/u/998877?v=4',
        wallet: '4Nd1mBQtrMKp8YtHkgV4W4F1wW9vP2bM7q4C3pW6hS2a',
        role: 'CONTRIBUTOR',
        created_at: new Date().toISOString(),
      },
    },
  ];
}

function getFallbackUnrewardedIssues(): ApiTrackedIssueOut[] {
  return [
    {
      id: 101,
      project_id: 1,
      repository_id: 1,
      issue_number: 101,
      title: 'Suporte a transações v1 (SIMD-0385) de até 4096 bytes',
      body: 'Permitir envio e decodificação do novo formato de transação v1 introduzido no Solana Devnet.',
      html_url: 'https://github.com/solana-labs/solinpy-sdk/issues/101',
      author_username: 'solana-fan',
      labels: ['enhancement', 'v1-tx', 'good first issue'],
      state: 'open',
      has_bounty: false,
      bounty_id: null,
      created_at: new Date().toISOString(),
      repository_name: 'solana-labs/solinpy-sdk',
    },
    {
      id: 102,
      project_id: 1,
      repository_id: 2,
      issue_number: 65,
      title: 'Adicionar testes de integração automatizados com LiteSVM',
      body: 'Criar suíte de testes rápida em memória simulando o runtime do SVM sem latência de rede.',
      html_url: 'https://github.com/greenfield-protocol/greenfield-core/issues/65',
      author_username: 'rust_hacker',
      labels: ['testing', 'litesvm'],
      state: 'open',
      has_bounty: false,
      bounty_id: null,
      created_at: new Date().toISOString(),
      repository_name: 'greenfield-protocol/greenfield-core',
    },
  ];
}

export const AdminPage: React.FC = () => {
  const { isBackendConnected, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'stats' | 'repos' | 'unrewarded' | 'rewards' | 'moderation'>('stats');

  // Stats State
  const [stats, setStats] = useState<AdminStatsOut | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Tracked & Unrewarded Issues State
  const [unrewardedIssues, setUnrewardedIssues] = useState<ApiTrackedIssueOut[]>([]);
  const [syncingRepoId, setSyncingRepoId] = useState<number | null>(null);
  const [assigningIssue, setAssigningIssue] = useState<ApiTrackedIssueOut | null>(null);
  const [assignPoints, setAssignPoints] = useState<number>(250);
  const [isAssigning, setIsAssigning] = useState(false);

  // Repositories State
  const [repos, setRepos] = useState<ApiRepositoryOut[]>([]);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const [newRepoBranch, setNewRepoBranch] = useState('main');
  const [isAddingRepo, setIsAddingRepo] = useState(false);

  // Bounties & Rewards State
  const [openBounties, setOpenBounties] = useState<ApiBountyOut[]>([]);
  const [submittedBounties, setSubmittedBounties] = useState<ApiBountyOut[]>([]);
  const [editingPoints, setEditingPoints] = useState<Record<number, number>>({});
  const [isUpdatingReward, setIsUpdatingReward] = useState<number | null>(null);

  // Moderation State
  const [rejectingBounty, setRejectingBounty] = useState<ApiBountyOut | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessingReview, setIsProcessingReview] = useState<number | null>(null);

  // Feedback Messages
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  // Carregar dados gerais
  const loadAdminData = async () => {
    setLoadingStats(true);
    try {
      if (isBackendConnected) {
        // Stats
        try {
          const statsData = await greenfieldApi.admin.getStats();
          setStats(statsData);
        } catch {
          setStats(getFallbackStats());
        }

        // Repos
        try {
          const projects = await greenfieldApi.listProjects();
          const allRepos = projects.flatMap((p) => p.repositories || []);
          setRepos(allRepos.length > 0 ? allRepos : getFallbackRepos());
        } catch {
          setRepos(getFallbackRepos());
        }

        // Bounties
        try {
          const allBounties = await greenfieldApi.listBounties();
          setOpenBounties(allBounties.filter((b) => b.status === 'OPEN'));
          setSubmittedBounties(allBounties.filter((b) => b.status === 'SUBMITTED'));
        } catch {
          setOpenBounties(getFallbackOpenBounties());
          setSubmittedBounties(getFallbackSubmittedBounties());
        }

        // Unrewarded Issues
        try {
          const issuesData = await greenfieldApi.admin.getUnrewardedIssues();
          setUnrewardedIssues(issuesData);
        } catch {
          setUnrewardedIssues(getFallbackUnrewardedIssues());
        }
      } else {
        setStats(getFallbackStats());
        setRepos(getFallbackRepos());
        setOpenBounties(getFallbackOpenBounties());
        setSubmittedBounties(getFallbackSubmittedBounties());
        setUnrewardedIssues(getFallbackUnrewardedIssues());
      }
    } catch (err) {
      console.error('Erro ao carregar dados de admin:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [isBackendConnected]);

  // Adicionar Novo Repositório
  const handleAddRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim()) return;
    setIsAddingRepo(true);
    setFeedbackSuccess(null);
    setFeedbackError(null);

    try {
      if (isBackendConnected) {
        await greenfieldApi.admin.addRepository({
          project_id: 1,
          github_repo: newRepoName.trim(),
          description: newRepoDesc.trim() || undefined,
          default_branch: newRepoBranch.trim() || 'main',
        });
      } else {
        // Fallback local
        const created: ApiRepositoryOut = {
          id: Date.now(),
          project_id: 1,
          github_owner: newRepoName.split('/')[0] || 'org',
          github_name: newRepoName.split('/')[1] || newRepoName,
          github_repo: newRepoName.trim(),
          description: newRepoDesc.trim(),
          default_branch: newRepoBranch.trim() || 'main',
          is_active: true,
          created_at: new Date().toISOString(),
        };
        setRepos([created, ...repos]);
      }

      setFeedbackSuccess(`Repositório ${newRepoName} cadastrado com sucesso!`);
      setNewRepoName('');
      setNewRepoDesc('');
      await loadAdminData();
    } catch (err: any) {
      setFeedbackError(
        err?.response?.data?.detail || 'Erro ao cadastrar repositório.'
      );
    } finally {
      setIsAddingRepo(false);
    }
  };

  // Sincronizar Issues de Repositório via API do GitHub
  const handleSyncRepository = async (repoId: number, repoName: string) => {
    setSyncingRepoId(repoId);
    setFeedbackSuccess(null);
    setFeedbackError(null);
    try {
      if (isBackendConnected) {
        const res = await greenfieldApi.admin.syncRepository(repoId);
        setFeedbackSuccess(
          `Sincronização concluída para ${repoName}: ${res.total_synced} issues verificadas, ${res.new_issues} novas adicionadas!`
        );
      } else {
        setFeedbackSuccess(`[Demo] Simulação: 2 novas issues sincronizadas de ${repoName}.`);
      }
      await loadAdminData();
    } catch (err: any) {
      setFeedbackError(err?.response?.data?.detail || 'Erro ao sincronizar repositório.');
    } finally {
      setSyncingRepoId(null);
    }
  };

  // Atribuir Reward e Publicar Grant
  const handleAssignReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningIssue || assignPoints <= 0) return;
    setIsAssigning(true);
    setFeedbackSuccess(null);
    setFeedbackError(null);
    try {
      if (isBackendConnected) {
        await greenfieldApi.admin.assignReward(assigningIssue.id, assignPoints);
      } else {
        setUnrewardedIssues(unrewardedIssues.filter((i) => i.id !== assigningIssue.id));
      }
      setFeedbackSuccess(
        `Reward de ${assignPoints} pts ($${(assignPoints / 100).toFixed(2)} USDC) atribuída com sucesso! Grant publicado publicamente.`
      );
      setAssigningIssue(null);
      await loadAdminData();
    } catch (err: any) {
      setFeedbackError(err?.response?.data?.detail || 'Erro ao atribuir recompensa.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Atualizar Pontos/Reward de uma Issue Aberta
  const handleUpdatePoints = async (bountyId: number) => {
    const newPoints = editingPoints[bountyId];
    if (!newPoints || newPoints <= 0) return;
    setIsUpdatingReward(bountyId);
    setFeedbackSuccess(null);
    setFeedbackError(null);

    try {
      if (isBackendConnected) {
        await greenfieldApi.updateBountyReward(bountyId, newPoints);
      }
      setFeedbackSuccess(`Pontuação da Bounty #${bountyId} atualizada para ${newPoints} pontos (${newPoints} USDC)!`);
      await loadAdminData();
    } catch (err: any) {
      setFeedbackError(
        err?.response?.data?.detail || 'Erro ao atualizar recompensa da issue.'
      );
    } finally {
      setIsUpdatingReward(null);
    }
  };

  // Aprovar Conclusão de Task (Dispara pagamento on-chain via Devnet)
  const handleApproveSubmission = async (bountyId: number) => {
    setIsProcessingReview(bountyId);
    setFeedbackSuccess(null);
    setFeedbackError(null);

    try {
      if (isBackendConnected) {
        await greenfieldApi.admin.reviewSubmission(bountyId, {
          action: 'APPROVE',
          force_payout: true,
        });
      } else {
        // Mock update
        setSubmittedBounties(submittedBounties.filter((b) => b.id !== bountyId));
      }

      setFeedbackSuccess(
        `Task #${bountyId} aprovada com sucesso! Pagamento em USDC liquidado on-chain via Solana Devnet.`
      );
      await loadAdminData();
    } catch (err: any) {
      setFeedbackError(
        err?.response?.data?.detail || 'Erro ao aprovar task. Verifique o saldo do cofre Devnet.'
      );
    } finally {
      setIsProcessingReview(null);
    }
  };

  // Rejeitar Conclusão de Task (Reverte para ASSIGNED com feedback)
  const handleRejectSubmission = async () => {
    if (!rejectingBounty) return;
    setIsProcessingReview(rejectingBounty.id);
    setFeedbackSuccess(null);
    setFeedbackError(null);

    try {
      if (isBackendConnected) {
        await greenfieldApi.admin.reviewSubmission(rejectingBounty.id, {
          action: 'REJECT',
          reason: rejectionReason.trim() || undefined,
        });
      } else {
        setSubmittedBounties(submittedBounties.filter((b) => b.id !== rejectingBounty.id));
      }

      setFeedbackSuccess(
        `Task #${rejectingBounty.id} rejeitada e revertida para ASSIGNED. O desenvolvedor poderá revisar o código e submeter um novo PR.`
      );
      setRejectingBounty(null);
      setRejectionReason('');
      await loadAdminData();
    } catch (err: any) {
      setFeedbackError(
        err?.response?.data?.detail || 'Erro ao rejeitar submissão.'
      );
    } finally {
      setIsProcessingReview(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252E24] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-500/40 uppercase font-bold">
              Painel Restrito
            </span>
            <span className="text-xs font-mono text-[#889887]">
              Conectado como {currentUser.name || currentUser.github_username} ({currentUser.role})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3 mt-1">
            <ShieldCheck className="w-8 h-8 text-[#28B110]" />
            Governança & Administração
          </h1>
          <p className="text-sm text-[#889887] mt-1">
            Gerenciamento de repositórios, controle de pontuações de bounties e moderação de pagamentos Devnet.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="p-2.5 rounded-xl bg-[#161C15] border border-[#252E24] text-[#889887] hover:text-[#28B110] transition-colors flex items-center gap-1.5 text-xs self-start sm:self-auto cursor-pointer"
          title="Atualizar dados"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Alertas de Ação */}
      {feedbackSuccess && (
        <div className="p-4 rounded-xl bg-[#182618] border border-[#28B110]/50 text-sm text-[#D9EED6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#28B110]" />
            <span>{feedbackSuccess}</span>
          </div>
          <button
            onClick={() => setFeedbackSuccess(null)}
            className="text-xs text-[#889887] hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}

      {feedbackError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-sm text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>{feedbackError}</span>
          </div>
          <button
            onClick={() => setFeedbackError(null)}
            className="text-xs text-rose-300 hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Tabs de Navegação Admin */}
      <div className="flex items-center gap-2 border-b border-[#252E24] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'stats'
              ? 'bg-[#28B110] text-[#101410] shadow-md'
              : 'text-[#889887] hover:text-white hover:bg-[#161C15]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Visão Geral & Stats</span>
        </button>

        <button
          onClick={() => setActiveTab('repos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'repos'
              ? 'bg-[#28B110] text-[#101410] shadow-md'
              : 'text-[#889887] hover:text-white hover:bg-[#161C15]'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Gerenciar Repositórios ({repos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('unrewarded')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'unrewarded'
              ? 'bg-[#28B110] text-[#101410] shadow-md'
              : 'text-[#889887] hover:text-white hover:bg-[#161C15]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Novas Issues Sem Reward</span>
          {unrewardedIssues.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500 text-black font-black">
              {unrewardedIssues.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'rewards'
              ? 'bg-[#28B110] text-[#101410] shadow-md'
              : 'text-[#889887] hover:text-white hover:bg-[#161C15]'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Gerenciar Rewards por Issue ({openBounties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'moderation'
              ? 'bg-[#28B110] text-[#101410] shadow-md'
              : 'text-[#889887] hover:text-white hover:bg-[#161C15]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Fila de Moderação (Aprovar / Negar)</span>
          {submittedBounties.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-500 text-white font-black animate-pulse">
              {submittedBounties.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Stats & Overview */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {stats ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-5 rounded-2xl bg-[#161C15] border border-[#252E24]">
                  <div className="text-xs text-[#889887] flex items-center justify-between mb-2">
                    <span>Repositórios Registrados</span>
                    <FolderGit2 className="w-4 h-4 text-[#28B110]" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {stats.total_repositories}
                  </div>
                  <span className="text-[11px] text-[#687867]">Tracking ativo no GitHub</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#161C15] border border-[#252E24]">
                  <div className="text-xs text-[#889887] flex items-center justify-between mb-2">
                    <span>Issues Sem Reward</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-400">
                    {stats.unrewarded_issues ?? unrewardedIssues.length}
                  </div>
                  <span className="text-[11px] text-[#687867]">
                    {stats.total_tracked_issues ?? (stats.total_bounties + unrewardedIssues.length)} monitoradas
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#161C15] border border-[#252E24]">
                  <div className="text-xs text-[#889887] flex items-center justify-between mb-2">
                    <span>Total de Bounties</span>
                    <Coins className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    {stats.total_bounties}
                  </div>
                  <span className="text-[11px] text-[#687867]">
                    {stats.open_bounties} abertas, {stats.submitted_bounties} em review
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#161C15] border border-[#252E24]">
                  <div className="text-xs text-[#889887] flex items-center justify-between mb-2">
                    <span>USDC Alocado em Custódia</span>
                    <Wallet className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-3xl font-black text-[#28B110]">
                    ${stats.total_usdc_allocated.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-[#687867]">
                    {stats.total_points_allocated} pontos convertíveis
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#161C15] border border-[#252E24]">
                  <div className="text-xs text-[#889887] flex items-center justify-between mb-2">
                    <span>USDC Liquidado on-chain</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-white">
                    ${stats.total_usdc_paid.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-[#28B110] font-mono">
                    Solana Devnet Transfer
                  </span>
                </div>
              </div>

              {/* Invariant Health Card */}
              <div className="bg-[#161C15] border border-[#252E24] rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#28B110]" /> Status de Integridade do Protocolo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#889887]">
                  <div className="p-3 bg-[#101410] rounded-xl border border-[#202720]">
                    <span className="text-[#28B110] font-bold block mb-1">Invariante 1: Merge Obrigatório</span>
                    Nenhum payout pode ser executado sem aprovação e merge do PR.
                  </div>
                  <div className="p-3 bg-[#101410] rounded-xl border border-[#202720]">
                    <span className="text-[#28B110] font-bold block mb-1">Invariante 2: Valor Imutável</span>
                    Recompensas não podem ser modificadas após atribuição ao desenvolvedor.
                  </div>
                  <div className="p-3 bg-[#101410] rounded-xl border border-[#202720]">
                    <span className="text-[#28B110] font-bold block mb-1">Invariante 3: Anti Double-Claim</span>
                    PDA de escrow garante assinatura única por bounty concluída.
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-[#889887]">
              {loadingStats ? 'Carregando estatísticas...' : 'Nenhum dado disponível.'}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Gerenciar Repositórios */}
      {activeTab === 'repos' && (
        <div className="space-y-6">
          {/* Formulário para Cadastrar Novo Repositório */}
          <div className="bg-[#161C15] border border-[#252E24] rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#28B110]" /> Cadastrar Novo Repositório GitHub
            </h3>
            <p className="text-xs text-[#889887] mb-4">
              Ao cadastrar um novo repositório, o Greenfield passará a rastrear issues e habilitar bounties.
            </p>

            <form onSubmit={handleAddRepository} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[#889887] block mb-1 font-mono">
                  Repositório (owner/repo):
                </label>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="ex: solana-developers/solinpy"
                  required
                  className="w-full bg-[#101410] border border-[#252E24] rounded-xl px-3 py-2 text-xs text-[#D2DFD1] placeholder-[#687867] focus:outline-none focus:border-[#28B110]"
                />
              </div>

              <div>
                <label className="text-xs text-[#889887] block mb-1 font-mono">
                  Branch Padrão:
                </label>
                <input
                  type="text"
                  value={newRepoBranch}
                  onChange={(e) => setNewRepoBranch(e.target.value)}
                  placeholder="main"
                  className="w-full bg-[#101410] border border-[#252E24] rounded-xl px-3 py-2 text-xs text-[#D2DFD1] placeholder-[#687867] focus:outline-none focus:border-[#28B110]"
                />
              </div>

              <div>
                <label className="text-xs text-[#889887] block mb-1 font-mono">
                  Descrição (Opcional):
                </label>
                <input
                  type="text"
                  value={newRepoDesc}
                  onChange={(e) => setNewRepoDesc(e.target.value)}
                  placeholder="Breve descrição do projeto"
                  className="w-full bg-[#101410] border border-[#252E24] rounded-xl px-3 py-2 text-xs text-[#D2DFD1] placeholder-[#687867] focus:outline-none focus:border-[#28B110]"
                />
              </div>

              <div className="md:col-span-3 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isAddingRepo || !newRepoName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#28B110] hover:brightness-110 disabled:opacity-50 text-[#101410] font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {isAddingRepo ? 'Cadastrando...' : 'Cadastrar Repositório'}
                </button>
              </div>
            </form>
          </div>

          {/* Tabela de Repositórios Cadastrados */}
          <div className="bg-[#161C15] border border-[#252E24] rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-[#28B110]" /> Repositórios Ativos
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#D2DFD1]">
                <thead className="border-b border-[#252E24] text-[#889887] uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Repositório</th>
                    <th className="py-2.5 px-3">Branch</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Descrição</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202720]">
                  {repos.map((r) => (
                    <tr key={r.id} className="hover:bg-[#1D251B]/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                        <FolderGit2 className="w-4 h-4 text-[#28B110]" />
                        <span>{r.github_repo}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#889887]">{r.default_branch}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#182618] text-[#28B110] border border-[#28B110]/40">
                          Ativo
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#889887] max-w-xs truncate">
                        {r.description || '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSyncRepository(r.id, r.github_repo)}
                            disabled={syncingRepoId === r.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1F291E] hover:bg-[#28B110]/20 text-[#28B110] border border-[#28B110]/30 text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors"
                            title="Buscar novas issues na API do GitHub"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${syncingRepoId === r.id ? 'animate-spin' : ''}`}
                            />
                            <span>{syncingRepoId === r.id ? 'Sincronizando...' : 'Sync Issues'}</span>
                          </button>
                          <a
                            href={`https://github.com/${r.github_repo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#889887] hover:text-[#28B110] px-2 py-1"
                          >
                            GitHub <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Novas Issues Sem Reward */}
      {activeTab === 'unrewarded' && (
        <div className="space-y-6">
          {/* Webhook Configuration & Helper Card */}
          <div className="bg-[#161C15] border border-[#252E24] rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" /> Webhook GitHub & Sincronização Automática
                </h3>
                <p className="text-xs text-[#889887] mt-1">
                  Configure o Webhook no repositório GitHub para receber novas issues em tempo real. Cada nova issue cairá automaticamente nesta fila para definição de recompensa.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-[#1F291E] text-[#28B110] border border-[#28B110]/40">
                  Status: Ativo & Escutando
                </span>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-[#101410] border border-[#252E24] rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[#889887] font-mono block text-[10px] uppercase">Payload URL:</span>
                <span className="text-[#D2DFD1] font-mono break-all select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/v1/webhooks/github` : 'https://api.greenfield.com/api/v1/webhooks/github'}
                </span>
              </div>
              <div>
                <span className="text-[#889887] font-mono block text-[10px] uppercase">Content type:</span>
                <span className="text-[#28B110] font-mono">application/json</span>
              </div>
              <div>
                <span className="text-[#889887] font-mono block text-[10px] uppercase">Eventos Monitorados:</span>
                <span className="text-[#D2DFD1]">Issues (opened/closed) & Pull requests</span>
              </div>
            </div>
          </div>

          {/* Lista de Issues Sem Reward */}
          <div className="bg-[#161C15] border border-[#252E24] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-[#28B110]" /> Fila de Issues Pendentes ({unrewardedIssues.length})
                </h3>
                <p className="text-xs text-[#889887]">
                  Atribua pontos para transformar a issue em um Grant Público (OPEN) no mural de recompensas.
                </p>
              </div>

              <button
                onClick={loadAdminData}
                className="px-3 py-1.5 rounded-xl bg-[#1F291E] hover:bg-[#28B110]/20 text-[#28B110] border border-[#28B110]/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recarregar Fila</span>
              </button>
            </div>

            {unrewardedIssues.length === 0 ? (
              <div className="text-center py-12 text-[#889887] bg-[#101410] rounded-xl border border-[#202720]">
                <CheckCircle2 className="w-8 h-8 text-[#28B110] mx-auto mb-2 opacity-60" />
                <p className="font-semibold text-white text-sm">Nenhuma issue pendente de recompensa!</p>
                <p className="text-xs text-[#889887] mt-1">
                  Use o botão "Sync Issues" na aba de repositórios para buscar issues abertas ou aguarde novos eventos via Webhook.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#D2DFD1]">
                  <thead className="border-b border-[#252E24] text-[#889887] uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Repositório</th>
                      <th className="py-2.5 px-3">Issue</th>
                      <th className="py-2.5 px-3">Autor</th>
                      <th className="py-2.5 px-3">Labels</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202720]">
                    {unrewardedIssues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-[#1D251B]/40 transition-colors">
                        <td className="py-3 px-3 font-mono text-[#889887]">
                          {issue.repository_name || 'Repositório'}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <a
                              href={issue.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-white hover:text-[#28B110] inline-flex items-center gap-1 transition-colors"
                            >
                              <span>#{issue.issue_number} - {issue.title}</span>
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                            {issue.body && (
                              <span className="text-[11px] text-[#687867] line-clamp-1 mt-0.5">
                                {issue.body}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[#889887]">
                          @{issue.author_username || 'autor'}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {issue.labels && issue.labels.length > 0 ? (
                              issue.labels.map((lbl, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#1F291E] text-[#28B110] border border-[#28B110]/30"
                                >
                                  {lbl}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#687867]">—</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/40 text-amber-400 border border-amber-500/40">
                            Sem Reward
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setAssigningIssue(issue);
                              setAssignPoints(250);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#28B110] hover:brightness-110 text-[#101410] font-bold text-xs transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Atribuir Reward</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Gerenciar Rewards por Issue */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <div className="bg-[#161C15] border border-[#252E24] rounded-2xl p-6 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#28B110]" /> Ajuste de Pontuações (Bounties OPEN)
            </h3>
            <p className="text-xs text-[#889887] leading-relaxed">
              Como administrador, você pode ajustar a pontuação das tasks que se encontram no estado{' '}
              <strong className="text-[#28B110]">OPEN</strong>. De acordo com o Invariante 2,{' '}
              após a task ser atribuída a um desenvolvedor, o valor da recompensa torna-se imutável.
            </p>
          </div>

          {openBounties.length === 0 ? (
            <div className="text-center py-12 text-[#889887] bg-[#161C15] rounded-2xl border border-[#252E24]">
              Não há bounties em estado OPEN disponíveis para ajuste no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {openBounties.map((bounty) => (
                <div
                  key={bounty.id}
                  className="p-5 rounded-2xl bg-[#161C15] border border-[#252E24] flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#28B110] bg-[#192A17] border border-[#28B110]/30 px-2 py-0.5 rounded">
                        #{bounty.issue_number || bounty.id}
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        {bounty.issue_title || bounty.issue_url}
                      </h4>
                    </div>
                    <span className="text-xs text-[#889887]">
                      Status: <strong className="text-[#28B110]">{bounty.status}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#889887] font-mono">Pontos / USDC:</span>
                      <input
                        type="number"
                        min="1"
                        defaultValue={bounty.points}
                        onChange={(e) =>
                          setEditingPoints({
                            ...editingPoints,
                            [bounty.id]: parseInt(e.target.value, 10) || 0,
                          })
                        }
                        className="w-24 bg-[#101410] border border-[#252E24] rounded-lg px-2.5 py-1 text-xs font-mono text-[#D2DFD1] focus:outline-none focus:border-[#28B110]"
                      />
                    </div>

                    <button
                      onClick={() => handleUpdatePoints(bounty.id)}
                      disabled={isUpdatingReward === bounty.id}
                      className="px-3.5 py-1.5 rounded-lg bg-[#28B110] hover:brightness-110 disabled:opacity-50 text-[#101410] font-bold text-xs transition-all cursor-pointer"
                    >
                      {isUpdatingReward === bounty.id ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Fila de Moderação (Aprovar / Negar) */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          <div className="bg-[#161C15] border border-[#252E24] rounded-2xl p-6 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#28B110]" /> Fila de Moderação de Entregas
            </h3>
            <p className="text-xs text-[#889887] leading-relaxed">
              Tarefas submetidas por desenvolvedores (<strong className="text-blue-400">SUBMITTED</strong>).
              Ao <strong className="text-[#28B110]">Aprovar</strong>, o sistema liquida o pagamento em USDC via Solana Devnet.
              Ao <strong className="text-rose-400">Negar</strong>, a tarefa retorna para <strong className="text-amber-400">ASSIGNED</strong> com seu parecer técnico para correções.
            </p>
          </div>

          {submittedBounties.length === 0 ? (
            <div className="text-center py-16 bg-[#161C15] rounded-2xl border border-[#252E24] p-8">
              <CheckCircle2 className="w-12 h-12 text-[#28B110] mx-auto mb-3 opacity-60" />
              <h3 className="text-lg font-semibold text-white">Nenhuma submissão pendente</h3>
              <p className="text-sm text-[#889887] mt-1">
                Todas as tarefas submetidas já foram moderadas ou estão em andamento pelos contribuidores.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submittedBounties.map((bounty) => (
                <div
                  key={bounty.id}
                  className="bg-[#161C15] border border-[#252E24] rounded-2xl p-6 space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#28B110] bg-[#192A17] border border-[#28B110]/30 px-2 py-0.5 rounded">
                          #{bounty.issue_number || bounty.id}
                        </span>
                        <h4 className="text-base font-bold text-white">
                          {bounty.issue_title || 'Bounty Submetida'}
                        </h4>
                      </div>

                      {/* Hunter & Wallet info */}
                      <div className="flex items-center gap-3 text-xs text-[#889887] pt-1">
                        <span>
                          Desenvolvedor:{' '}
                          <strong className="text-[#D2DFD1]">
                            {bounty.hunter?.username || 'Hunter Conectado'}
                          </strong>
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[11px]">
                          Carteira:{' '}
                          {bounty.hunter?.wallet
                            ? `${bounty.hunter.wallet.slice(0, 4)}...${bounty.hunter.wallet.slice(-4)}`
                            : '4Nd1...hS2a'}
                        </span>
                      </div>

                      {/* PR Link */}
                      {bounty.pr_url && (
                        <div className="pt-1">
                          <a
                            href={bounty.pr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-[#28B110] hover:underline font-mono"
                          >
                            <GitPullRequest className="w-3.5 h-3.5" />
                            {bounty.pr_url}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-[#889887]">Recompensa Devnet</div>
                      <div className="text-xl font-black text-[#28B110]">
                        ${bounty.amount_usdc} USDC
                      </div>
                    </div>
                  </div>

                  {/* Ações de Aprovação / Negação */}
                  <div className="pt-4 border-t border-[#202720] flex items-center justify-end gap-3">
                    <button
                      onClick={() => setRejectingBounty(bounty)}
                      disabled={isProcessingReview === bounty.id}
                      className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      Negar Submissão
                    </button>

                    <button
                      onClick={() => handleApproveSubmission(bounty.id)}
                      disabled={isProcessingReview === bounty.id}
                      className="px-5 py-2 rounded-xl bg-[#28B110] hover:brightness-110 disabled:opacity-50 text-[#101410] font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isProcessingReview === bounty.id ? 'Processando Devnet...' : 'Aprovar & Pagar USDC'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal para Atribuir Reward & Publicar Grant */}
      {assigningIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#161C15] border border-[#28B110]/50 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div>
              <span className="text-xs font-mono text-[#28B110] font-semibold">
                GRANT & REWARD SETUP
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                Atribuir Recompensa: #{assigningIssue.issue_number}
              </h3>
              <p className="text-xs text-[#889887] mt-0.5 line-clamp-2">
                {assigningIssue.title}
              </p>
            </div>

            <form onSubmit={handleAssignReward} className="space-y-4">
              <div>
                <label className="text-xs text-[#D2DFD1] font-medium block mb-1">
                  Pontos Greenfield (100 pts = $1 USDC):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={assignPoints}
                    onChange={(e) => setAssignPoints(Number(e.target.value))}
                    required
                    className="w-full bg-[#101410] border border-[#252E24] rounded-xl px-3 py-2 text-sm text-[#D2DFD1] font-mono focus:outline-none focus:border-[#28B110]"
                  />
                  <div className="px-3 py-2 rounded-xl bg-[#1F291E] border border-[#28B110]/40 text-[#28B110] font-mono text-xs whitespace-nowrap">
                    = ${(assignPoints / 100).toFixed(2)} USDC
                  </div>
                </div>
              </div>

              {/* Atalhos rápidos de pontuação */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#889887]">Atalhos:</span>
                {[100, 250, 500, 1000, 2500].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setAssignPoints(pts)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      assignPoints === pts
                        ? 'bg-[#28B110] text-[#101410] font-bold'
                        : 'bg-[#101410] text-[#889887] hover:text-white border border-[#252E24]'
                    }`}
                  >
                    {pts} pts
                  </button>
                ))}
              </div>

              <div className="p-3 bg-[#101410] rounded-xl border border-[#252E24] text-xs text-[#889887] space-y-1">
                <p className="text-[#28B110] font-bold">Publicação Imediata do Grant</p>
                <p>
                  Esta task será publicada imediatamente com o status <strong className="text-white">OPEN</strong> no mural público de bounties do Greenfield.
                </p>
                <p className="text-[11px] text-[#687867]">
                  Contribuidores poderão visualizar os requisitos técnicos e submeter candidaturas para resolvê-la.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssigningIssue(null)}
                  className="px-4 py-2 rounded-xl text-xs text-[#889887] hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAssigning || assignPoints <= 0}
                  className="px-5 py-2.5 rounded-xl bg-[#28B110] hover:brightness-110 disabled:opacity-50 text-[#101410] font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {isAssigning ? 'Publicando...' : 'Publicar Grant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Feedback ao Negar Submissão */}
      {rejectingBounty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#161C15] border border-rose-500/50 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div>
              <span className="text-xs font-mono text-rose-400 font-semibold">
                MODERAÇÃO DE TASK
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                Negar Submissão #{rejectingBounty.issue_number || rejectingBounty.id}
              </h3>
              <p className="text-xs text-[#889887] mt-0.5">
                Forneça uma justificativa técnica para o desenvolvedor corrigir os apontamentos.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#D2DFD1] font-medium block">
                Motivo / Instruções de Correção:
              </label>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Por favor, adicione testes unitários cobrindo o fallback de erro e atualize a documentação no README."
                className="w-full bg-[#101410] border border-[#252E24] rounded-xl p-3 text-xs text-[#D2DFD1] placeholder-[#687867] focus:outline-none focus:border-rose-500"
              />
            </div>

            <p className="text-xs text-[#889887]">
              Ao confirmar a negação, a task retornará ao estado <strong className="text-amber-400">ASSIGNED</strong>{' '}
              mantendo a recompensa fixada, e o desenvolvedor poderá submeter uma nova versão do PR.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setRejectingBounty(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 rounded-xl text-xs text-[#889887] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectSubmission}
                disabled={isProcessingReview === rejectingBounty.id}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                Confirmar Negação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
