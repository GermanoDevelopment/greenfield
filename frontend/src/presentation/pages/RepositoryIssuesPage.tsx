import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ListTodo,
  FolderGit2,
  ExternalLink,
  Coins,
  Send,
  GitPullRequest,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  greenfieldApi,
  type ApiGitHubIssueOut,
  type ApiBountyOut,
} from '../../services/api';

// Função mock para issues caso offline ou API sem issues
function getMockIssues(): ApiGitHubIssueOut[] {
  return [
    {
      number: 42,
      title: 'Implementar validação off-chain de assinaturas Ed25519 em Solinpy',
      body: 'Precisamos criar uma rotina em Python que faça a verificação de assinatura Ed25519 compatível com Solana antes de enviar a transação ao cluster Devnet.',
      html_url: 'https://github.com/solana-labs/solinpy-sdk/issues/42',
      state: 'open',
      author_username: 'solana-maintainer',
      labels: ['bounty', 'solana', 'python', 'security'],
      has_bounty: true,
      bounty_id: 1,
      bounty_status: 'OPEN',
      bounty_points: 350,
    },
    {
      number: 45,
      title: 'Adicionar suporte a simulação de transações v1 (SIMD-0385) no SDK',
      body: 'O formato de transação v1 suporta até 4096 bytes. Precisamos de testes unitários para a serialização e envio ao RPC Devnet.',
      html_url: 'https://github.com/solana-labs/solinpy-sdk/issues/45',
      state: 'open',
      author_username: 'solana-maintainer',
      labels: ['bounty', 'v1-tx', 'devnet'],
      has_bounty: true,
      bounty_id: 2,
      bounty_status: 'ASSIGNED',
      bounty_points: 500,
    },
    {
      number: 51,
      title: 'Otimizar cálculo de Compute Units (CU) no CPI de Transferência SPL-Token',
      body: 'Reduzir o consumo de compute units adicionando pre-compute unit price instructions e limites de heap dinâmicos.',
      html_url: 'https://github.com/solana-labs/solinpy-sdk/issues/51',
      state: 'open',
      author_username: 'solana-maintainer',
      labels: ['enhancement', 'compute-units', 'solana'],
      has_bounty: true,
      bounty_id: 3,
      bounty_status: 'SUBMITTED',
      bounty_points: 250,
    },
    {
      number: 54,
      title: 'Criar documentação de integração do Greenfield com Solana Wallet Adapter',
      body: 'Escrever guia com exemplos de código em TypeScript usando @solana/kit e @solana/react.',
      html_url: 'https://github.com/greenfield-protocol/greenfield-core/issues/54',
      state: 'open',
      author_username: 'greenfield-admin',
      labels: ['documentation', 'good-first-issue'],
      has_bounty: true,
      bounty_id: 4,
      bounty_status: 'COMPLETED',
      bounty_points: 150,
    },
  ];
}

function getMockBounties(): ApiBountyOut[] {
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
      issue_body: 'Precisamos criar uma rotina em Python que faça a verificação...',
      amount_usdc: 350,
      points: 350,
      status: 'OPEN',
      escrow_pda: 'Escrow1111111111111111111111111111111111',
      pr_url: null,
      tx_signature: null,
      claimed_at: null,
      created_at: new Date().toISOString(),
      applicants: [],
    },
    {
      id: 2,
      project_id: 1,
      repository_id: 1,
      issuer_id: 1,
      hunter_id: 2,
      issue_url: 'https://github.com/solana-labs/solinpy-sdk/issues/45',
      issue_number: 45,
      issue_title: 'Adicionar suporte a simulação de transações v1 (SIMD-0385) no SDK',
      issue_body: 'O formato de transação v1...',
      amount_usdc: 500,
      points: 500,
      status: 'ASSIGNED',
      escrow_pda: 'Escrow2222222222222222222222222222222222',
      pr_url: null,
      tx_signature: null,
      claimed_at: null,
      created_at: new Date().toISOString(),
      applicants: [],
    },
    {
      id: 3,
      project_id: 1,
      repository_id: 1,
      issuer_id: 1,
      hunter_id: 2,
      issue_url: 'https://github.com/solana-labs/solinpy-sdk/issues/51',
      issue_number: 51,
      issue_title: 'Otimizar cálculo de Compute Units (CU) no CPI de Transferência SPL-Token',
      issue_body: 'Reduzir consumo...',
      amount_usdc: 250,
      points: 250,
      status: 'SUBMITTED',
      escrow_pda: 'Escrow3333333333333333333333333333333333',
      pr_url: 'https://github.com/solana-labs/solinpy-sdk/pull/52',
      tx_signature: null,
      claimed_at: null,
      created_at: new Date().toISOString(),
      applicants: [],
    },
    {
      id: 4,
      project_id: 1,
      repository_id: 1,
      issuer_id: 1,
      hunter_id: 2,
      issue_url: 'https://github.com/greenfield-protocol/greenfield-core/issues/54',
      issue_number: 54,
      issue_title: 'Criar documentação de integração do Greenfield com Solana Wallet Adapter',
      issue_body: 'Documentação...',
      amount_usdc: 150,
      points: 150,
      status: 'COMPLETED',
      escrow_pda: 'Escrow4444444444444444444444444444444444',
      pr_url: 'https://github.com/greenfield-protocol/greenfield-core/pull/55',
      tx_signature: '5K2bM7q4C3pW6hS2aK1g8V9rXyZ3wT6uN4jH8kL9vP2bM7q4C3pW6hS2aK1g8V9r',
      claimed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      applicants: [],
    },
  ];
}

export const RepositoryIssuesPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { isBackendConnected } = useApp();

  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<ApiGitHubIssueOut[]>([]);
  const [bounties, setBounties] = useState<ApiBountyOut[]>([]);

  // Modais de Ação
  const [applyModalBounty, setApplyModalBounty] = useState<ApiBountyOut | null>(null);
  const [proposalText, setProposalText] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const [submitPrModalBounty, setSubmitPrModalBounty] = useState<ApiBountyOut | null>(null);
  const [prUrl, setPrUrl] = useState('');
  const [isSubmittingPr, setIsSubmittingPr] = useState(false);

  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  const repoId = id ? parseInt(id, 10) : 1;

  const loadData = async () => {
    setLoading(true);
    try {
      if (isBackendConnected) {
        // Tenta carregar issues da API do backend
        try {
          const repoIssues = await greenfieldApi.listRepositoryIssues(repoId);
          setIssues(repoIssues);
        } catch {
          // Se falhar ou não houver mock do github, preencha lista funcional
          setIssues(getMockIssues());
        }

        const allBounties = await greenfieldApi.listBounties();
        setBounties(allBounties);
      } else {
        setIssues(getMockIssues());
        setBounties(getMockBounties());
      }
    } catch (err) {
      console.error('Erro ao carregar issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [repoId, isBackendConnected]);

  // Candidatar-se à Bounty
  const handleApply = async () => {
    if (!applyModalBounty) return;
    setIsApplying(true);
    setActionErrorMessage(null);
    try {
      if (isBackendConnected) {
        await greenfieldApi.applyToBounty(applyModalBounty.id, proposalText);
      }
      setActionSuccessMessage(
        `Candidatura enviada com sucesso para a Issue #${applyModalBounty.issue_number || applyModalBounty.id}!`
      );
      setApplyModalBounty(null);
      setProposalText('');
      await loadData();
    } catch (err: any) {
      setActionErrorMessage(
        err?.response?.data?.detail || 'Erro ao enviar candidatura. Tente novamente.'
      );
    } finally {
      setIsApplying(false);
    }
  };

  // Submeter Pull Request
  const handleSubmitPr = async () => {
    if (!submitPrModalBounty || !prUrl) return;
    setIsSubmittingPr(true);
    setActionErrorMessage(null);
    try {
      if (isBackendConnected) {
        await greenfieldApi.submitBounty(submitPrModalBounty.id, prUrl);
      }
      setActionSuccessMessage(
        `Pull Request submetido com sucesso! A tarefa agora está em 'SUBMITTED' aguardando revisão.`
      );
      setSubmitPrModalBounty(null);
      setPrUrl('');
      await loadData();
    } catch (err: any) {
      setActionErrorMessage(
        err?.response?.data?.detail || 'Erro ao submeter Pull Request. Verifique a URL.'
      );
    } finally {
      setIsSubmittingPr(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252E24] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#889887] mb-1">
            <Link to="/repositories" className="hover:text-[#28B110] flex items-center gap-1">
              <FolderGit2 className="w-3.5 h-3.5" /> Repositórios
            </Link>
            <span>/</span>
            <span className="text-[#D9EED6]">Issues & Bounties</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ListTodo className="w-8 h-8 text-[#28B110]" />
            Issues & Bounties do Repositório
          </h1>
          <p className="text-sm text-[#889887] mt-1">
            Cada issue pontuada gera uma recompensa garantida em USDC após o merge do PR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/repositories"
            className="px-3.5 py-2 rounded-xl bg-[#161C15] border border-[#252E24] text-xs text-[#D2DFD1] hover:text-[#28B110] hover:border-[#28B110]/40 transition-all font-medium"
          >
            Trocar Repositório
          </Link>
        </div>
      </div>

      {/* Notificações de Sucesso / Erro */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-[#182618] border border-[#28B110]/50 text-sm text-[#D9EED6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#28B110]" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-xs text-[#889887] hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 text-sm text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <span>{actionErrorMessage}</span>
          </div>
          <button
            onClick={() => setActionErrorMessage(null)}
            className="text-xs text-rose-300 hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Lista de Issues */}
      {loading ? (
        <div className="text-center py-16 text-[#889887]">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#28B110] mb-3"></div>
          <p className="text-sm">Carregando issues e pontuações...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-16 bg-[#161C15] rounded-2xl border border-[#252E24] p-8">
          <ListTodo className="w-12 h-12 text-[#687867] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">Nenhuma issue encontrada</h3>
          <p className="text-sm text-[#889887] mt-1">
            Não há issues abertas neste repositório no momento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => {
            const linkedBounty = bounties.find(
              (b) => b.issue_number === issue.number || b.id === issue.bounty_id
            );
            const status = linkedBounty?.status || issue.bounty_status || (issue.has_bounty ? 'OPEN' : 'SEM BOUNTY');
            const points = linkedBounty?.points || issue.bounty_points || 0;
            const usdc = linkedBounty?.amount_usdc || points;

            return (
              <div
                key={issue.number}
                className="bg-[#161C15] border border-[#252E24] hover:border-[#28B110]/40 rounded-2xl p-5 md:p-6 transition-all space-y-4"
              >
                {/* Linha 1: Título, Número da Issue e Badges */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-[#28B110] bg-[#192A17] border border-[#28B110]/30 px-2 py-0.5 rounded">
                        #{issue.number}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-white hover:text-[#28B110] transition-colors">
                        <a href={issue.html_url} target="_blank" rel="noopener noreferrer">
                          {issue.title}
                        </a>
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-[#889887] line-clamp-2">
                      {issue.body || 'Sem descrição detalhada fornecida na issue.'}
                    </p>

                    {/* Labels / Tags */}
                    {issue.labels && issue.labels.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {issue.labels.map((lbl) => (
                          <span
                            key={lbl}
                            className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#1D241C] text-[#9EAE9D] border border-[#252E24]"
                          >
                            {lbl}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recompensa & Status Badge */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#202720]">
                    <div className="text-right">
                      <div className="text-xs text-[#889887] font-medium">Recompensa</div>
                      <div className="text-lg sm:text-xl font-black text-[#28B110] flex items-center justify-end gap-1">
                        <Coins className="w-4 h-4" />
                        <span>${usdc} USDC</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#687867]">
                        ({points} pontos)
                      </span>
                    </div>

                    <div className="mt-1">
                      {status === 'OPEN' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-[#182618] text-[#28B110] border border-[#28B110]/40">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aberto
                        </span>
                      )}
                      {status === 'ASSIGNED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-950/40 text-amber-400 border border-amber-500/40">
                          <UserCheck className="w-3.5 h-3.5" /> Atribuído
                        </span>
                      )}
                      {status === 'SUBMITTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-blue-950/40 text-blue-400 border border-blue-500/40">
                          <Clock className="w-3.5 h-3.5" /> Em Revisão PR
                        </span>
                      )}
                      {status === 'COMPLETED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-purple-950/40 text-purple-300 border border-purple-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Concluído & Pago
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Linha 2: Ações & Detalhes */}
                <div className="pt-3 border-t border-[#202720] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4">
                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#889887] hover:text-[#D2DFD1] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Ver no GitHub
                    </a>

                    {linkedBounty?.pr_url && (
                      <a
                        href={linkedBounty.pr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#28B110] hover:underline"
                      >
                        <GitPullRequest className="w-3.5 h-3.5" /> Ver Pull Request
                      </a>
                    )}
                  </div>

                  {/* Botões de Ação Dinâmicos */}
                  <div className="flex items-center gap-2">
                    {/* Botão de Candidatura (Disponível quando OPEN) */}
                    {status === 'OPEN' && (
                      <button
                        onClick={() => {
                          const targetBounty = linkedBounty || {
                            id: issue.bounty_id || 1,
                            project_id: 1,
                            repository_id: repoId,
                            issuer_id: 1,
                            hunter_id: null,
                            issue_url: issue.html_url,
                            issue_number: issue.number,
                            issue_title: issue.title,
                            issue_body: issue.body,
                            amount_usdc: usdc,
                            points: points,
                            status: 'OPEN',
                            escrow_pda: null,
                            pr_url: null,
                            tx_signature: null,
                            claimed_at: null,
                            created_at: new Date().toISOString(),
                          };
                          setApplyModalBounty(targetBounty);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#28B110] hover:brightness-110 text-[#101410] font-bold text-xs transition-all shadow-xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Candidatar-se (Apply)
                      </button>
                    )}

                    {/* Botão de Enviar PR (Disponível quando ASSIGNED) */}
                    {status === 'ASSIGNED' && (
                      <button
                        onClick={() => {
                          const targetBounty = linkedBounty || {
                            id: issue.bounty_id || 2,
                            project_id: 1,
                            repository_id: repoId,
                            issuer_id: 1,
                            hunter_id: 2,
                            issue_url: issue.html_url,
                            issue_number: issue.number,
                            issue_title: issue.title,
                            issue_body: issue.body,
                            amount_usdc: usdc,
                            points: points,
                            status: 'ASSIGNED',
                            escrow_pda: null,
                            pr_url: null,
                            tx_signature: null,
                            claimed_at: null,
                            created_at: new Date().toISOString(),
                          };
                          setSubmitPrModalBounty(targetBounty);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#192A17] hover:bg-[#28B110] text-[#28B110] hover:text-[#101410] font-semibold text-xs border border-[#28B110]/50 transition-all cursor-pointer"
                      >
                        <GitPullRequest className="w-3.5 h-3.5" />
                        Submeter PR de Conclusão
                      </button>
                    )}

                    {status === 'SUBMITTED' && (
                      <span className="text-[11px] font-mono text-[#889887] italic">
                        Aguardando validação e aprovação do Administrador
                      </span>
                    )}

                    {status === 'COMPLETED' && linkedBounty?.tx_signature && (
                      <a
                        href={`https://explorer.solana.com/tx/${linkedBounty.tx_signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#28B110] font-mono bg-[#182618] px-2.5 py-1 rounded-md border border-[#28B110]/30 hover:underline"
                      >
                        <Coins className="w-3.5 h-3.5" /> Ver Transação Solana
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Candidatar-se à Bounty (Apply) */}
      {applyModalBounty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#161C15] border border-[#28B110]/50 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div>
              <span className="text-xs font-mono text-[#28B110] font-semibold">
                CANDIDATURA DE TASK
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                Candidatar-se à Issue #{applyModalBounty.issue_number}
              </h3>
              <p className="text-xs text-[#889887] mt-0.5">
                {applyModalBounty.issue_title}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#D2DFD1] font-medium block">
                Proposta Técnica / Abordagem de Resolução:
              </label>
              <textarea
                rows={4}
                value={proposalText}
                onChange={(e) => setProposalText(e.target.value)}
                placeholder="Descreva brevemente sua estratégia de implementação, arquivos a serem alterados e estimativa de entrega..."
                className="w-full bg-[#101410] border border-[#252E24] rounded-xl p-3 text-xs text-[#D2DFD1] placeholder-[#687867] focus:outline-none focus:border-[#28B110]"
              />
            </div>

            <div className="p-3 bg-[#101410] rounded-xl border border-[#252E24] text-xs space-y-1">
              <div className="flex justify-between text-[#889887]">
                <span>Recompensa Fixada:</span>
                <span className="font-bold text-[#28B110]">${applyModalBounty.amount_usdc} USDC</span>
              </div>
              <div className="flex justify-between text-[#889887]">
                <span>Invariante:</span>
                <span className="text-[#D2DFD1]">Merge Obrigatório & Recompensa Imutável</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setApplyModalBounty(null)}
                className="px-4 py-2 rounded-xl text-xs text-[#889887] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                disabled={isApplying || !proposalText.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#28B110] hover:brightness-110 disabled:opacity-50 text-[#101410] font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                {isApplying ? 'Enviando Proposta...' : 'Confirmar Candidatura'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Submeter Pull Request (Submit PR) */}
      {submitPrModalBounty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#161C15] border border-[#28B110]/50 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div>
              <span className="text-xs font-mono text-[#28B110] font-semibold">
                ENTREGA DE TASK
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                Submeter Pull Request para #{submitPrModalBounty.issue_number}
              </h3>
              <p className="text-xs text-[#889887] mt-0.5">
                Informe o link do Pull Request aberto no GitHub que resolve esta issue.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#D2DFD1] font-medium block">
                URL do Pull Request (GitHub):
              </label>
              <input
                type="url"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                placeholder="https://github.com/solana-labs/solinpy-sdk/pull/52"
                className="w-full bg-[#101410] border border-[#252E24] rounded-xl p-3 text-xs text-[#D2DFD1] placeholder-[#687867] focus:outline-none focus:border-[#28B110]"
              />
            </div>

            <div className="p-3 bg-[#101410] rounded-xl border border-[#252E24] text-xs text-[#889887] leading-relaxed">
              Ao submeter o PR, o status mudará para <strong className="text-blue-400">SUBMITTED</strong>.
              O mantenedor ou administrador do projeto irá revisar o código e, após o merge, o pagamento de <strong className="text-[#28B110]">${submitPrModalBounty.amount_usdc} USDC</strong> será disparado via Devnet.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSubmitPrModalBounty(null)}
                className="px-4 py-2 rounded-xl text-xs text-[#889887] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitPr}
                disabled={isSubmittingPr || !prUrl.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#28B110] hover:brightness-110 disabled:opacity-50 text-[#101410] font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                {isSubmittingPr ? 'Submetendo PR...' : 'Submeter PR para Revisão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepositoryIssuesPage;
