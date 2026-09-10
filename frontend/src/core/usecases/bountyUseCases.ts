import type {
  Bounty,
  BountyStatus,
  Claim,
  Proposal,
  PullRequest,
  Repository,
  Treasury,
  User,
} from '../domain/types';
import { pointsToUsdc } from '../domain/types';
import type {
  IBountyRepository,
  IGitHubService,
  ISolanaService,
  ITreasuryRepository,
} from '../domain/ports';

export class BountyUseCases {
  private bountyRepo: IBountyRepository;
  private treasuryRepo: ITreasuryRepository;
  private solanaService: ISolanaService;
  private gitHubService?: IGitHubService;

  constructor(
    bountyRepo: IBountyRepository,
    treasuryRepo: ITreasuryRepository,
    solanaService: ISolanaService,
    gitHubService?: IGitHubService
  ) {
    this.bountyRepo = bountyRepo;
    this.treasuryRepo = treasuryRepo;
    this.solanaService = solanaService;
    this.gitHubService = gitHubService;
  }

  /**
   * Mantenedor: Aprovação de Repositório para a Rodada de Contribuição
   */
  async toggleRepositoryRoundApproval(
    maintainer: User,
    repoId: string,
    approved: boolean
  ): Promise<Repository> {
    const roleUpper = (maintainer.role || '').toUpperCase();
    if (roleUpper !== 'MAINTAINER' && roleUpper !== 'ADMIN' && maintainer.role !== 'both' && maintainer.role !== 'maintainer') {
      throw new Error('Apenas mantenedores podem alterar a participação de repositórios nas rodadas.');
    }

    if (!this.gitHubService) {
      throw new Error('Serviço do GitHub não injetado.');
    }

    return await this.gitHubService.setRepositoryRoundStatus(repoId, approved);
  }

  /**
   * Estado 1: Mantenedor seleciona Issue e cria Bounty no Programa
   * Invariante 4: Tesouro solvente (pointsToUsdc(points) <= treasury.available_usdc)
   */
  async createBounty(params: {
    issueId: string;
    repositoryId: string;
    maintainer: User;
    points: number;
    developer?: User;
  }): Promise<Bounty> {
    if (params.points < 100) {
      throw new Error('A recompensa mínima é de 100 pontos (1 USDC).');
    }

    const usdcAmount = pointsToUsdc(params.points);

    // Invariante 4: Tesouro solvente
    const treasury = await this.treasuryRepo.getTreasury();
    if (treasury.available_usdc < usdcAmount) {
      throw new Error(
        `Invariante 4 violada: Saldo insuficiente no Tesouro Comunitário. Disponível: $${treasury.available_usdc.toFixed(
          2
        )} USDC, Solicitado: $${usdcAmount.toFixed(2)} USDC.`
      );
    }

    // Reserva fundos no tesouro
    const reserved = await this.treasuryRepo.reserveFunds(usdcAmount);
    if (!reserved) {
      throw new Error('Falha ao reservar fundos no Tesouro Comunitário.');
    }

    // Se nenhum desenvolvedor for atribuído diretamente, a issue fica aberta para propostas
    const initialStatus: BountyStatus = params.developer
      ? 'ASSIGNED'
      : 'OPEN_FOR_PROPOSALS';

    return await this.bountyRepo.create({
      issue_id: params.issueId,
      repository_id: params.repositoryId,
      maintainer_id: params.maintainer.id,
      maintainer: params.maintainer,
      developer_id: params.developer?.id,
      developer: params.developer,
      points: params.points,
      usdc_amount: usdcAmount,
      status: initialStatus,
      accepted_at: params.developer ? new Date().toISOString() : undefined,
      github_issue_assigned: Boolean(params.developer),
      proposals: [],
    });
  }

  /**
   * Estado 2: Desenvolvedor submete Proposta de Associação para a Issue
   */
  async submitProposal(params: {
    bountyId: string;
    developer: User;
    coverLetter: string;
    estimatedDays: number;
  }): Promise<Bounty> {
    const bounty = await this.bountyRepo.getById(params.bountyId);
    if (!bounty) throw new Error('Bounty não encontrada.');

    if (
      bounty.status !== 'OPEN_FOR_PROPOSALS' &&
      bounty.status !== 'FUNDED'
    ) {
      throw new Error(
        `Não é possível enviar proposta. A issue está no estado ${bounty.status}.`
      );
    }

    if (!params.coverLetter.trim()) {
      throw new Error('Descreva sua proposta técnica e plano de resolução.');
    }

    const proposal: Proposal = {
      id: `prop-${Date.now()}`,
      bounty_id: params.bountyId,
      developer_id: params.developer.id,
      developer: params.developer,
      cover_letter: params.coverLetter.trim(),
      estimated_days: Math.max(1, params.estimatedDays),
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    return await this.bountyRepo.addProposal(params.bountyId, proposal);
  }

  /**
   * Estado 2.1: Mantenedor avalia propostas e atribui a Issue via GitHub API
   * Invariante 2: Valor imutável após aceitação
   */
  async acceptProposalAndAssign(
    bountyId: string,
    proposalId: string,
    maintainer: User
  ): Promise<Bounty> {
    const bounty = await this.bountyRepo.getById(bountyId);
    if (!bounty) throw new Error('Bounty não encontrada.');

    if (bounty.maintainer_id !== maintainer.id) {
      throw new Error('Apenas o mantenedor responsável pelo repositório pode aceitar propostas.');
    }

    const proposal = bounty.proposals?.find((p) => p.id === proposalId);
    if (!proposal) throw new Error('Proposta não encontrada.');

    // Integração com a API do GitHub para atribuir a issue ao desenvolvedor
    if (this.gitHubService && bounty.repository && bounty.issue) {
      const devUsername = proposal.developer?.github_username || 'developer';
      await this.gitHubService.assignIssueToDeveloper(
        bounty.repository.id,
        bounty.issue.number,
        devUsername
      );
    }

    // Atualiza estado no repositório
    return await this.bountyRepo.acceptProposal(bountyId, proposalId);
  }

  /**
   * Atribuição direta legada de desenvolvedor
   */
  async assignDeveloper(bountyId: string, developer: User): Promise<Bounty> {
    const bounty = await this.bountyRepo.getById(bountyId);
    if (!bounty) throw new Error('Bounty não encontrada');

    if (
      bounty.status !== 'FUNDED' &&
      bounty.status !== 'OPEN_FOR_PROPOSALS' &&
      bounty.status !== 'ASSIGNED'
    ) {
      throw new Error(`Não é possível atribuir desenvolvedor no estado ${bounty.status}.`);
    }

    return await this.bountyRepo.update(bountyId, {
      developer_id: developer.id,
      developer,
      status: 'ASSIGNED',
      accepted_at: new Date().toISOString(),
      github_issue_assigned: true,
    });
  }

  /**
   * Estado 3: Desenvolvedor inicia o trabalho
   */
  async startWork(bountyId: string, developerId: string): Promise<Bounty> {
    const bounty = await this.bountyRepo.getById(bountyId);
    if (!bounty) throw new Error('Bounty não encontrada');

    if (bounty.status !== 'ASSIGNED') {
      throw new Error(`Trabalho só pode ser iniciado no estado ASSIGNED. Estado atual: ${bounty.status}`);
    }

    if (bounty.developer_id !== developerId) {
      throw new Error('Apenas o desenvolvedor atribuído pode iniciar o trabalho.');
    }

    return await this.bountyRepo.update(bountyId, {
      status: 'IN_PROGRESS',
    });
  }

  /**
   * Estado 3.1: Desenvolvedor abre Pull Request vinculado à issue
   */
  async openPullRequest(
    bountyId: string,
    prData: {
      github_pr_id: number;
      number: number;
      title: string;
      url: string;
      author_github_username: string;
    }
  ): Promise<Bounty> {
    const bounty = await this.bountyRepo.getById(bountyId);
    if (!bounty) throw new Error('Bounty não encontrada');

    if (bounty.status !== 'ASSIGNED' && bounty.status !== 'IN_PROGRESS') {
      throw new Error(
        `Não é possível associar Pull Request no estado ${bounty.status}. Estado deve ser ASSIGNED ou IN_PROGRESS.`
      );
    }

    const pr: PullRequest = {
      id: `pr-${Date.now()}`,
      bounty_id: bountyId,
      ...prData,
      merged: false,
    };

    return await this.bountyRepo.update(bountyId, {
      pr,
      status: 'PR_OPEN',
    });
  }

  /**
   * Estado 4 & 5: Mantenedor faz Merge do PR e Plataforma Liquida o Pagamento Automatizado
   * Invariante 1: Merge obrigatório (PR aberto != recompensa liberada; PR merged = condição necessária)
   * Invariante 3: Prevenção de Double-Claim
   */
  async mergePullRequest(
    bountyId: string,
    autoClaim: boolean = true
  ): Promise<{ bounty: Bounty; claim?: Claim }> {
    const bounty = await this.bountyRepo.getById(bountyId);
    if (!bounty) throw new Error('Bounty não encontrada');

    // Invariante 1 com correção lógica estrita
    if (bounty.status !== 'PR_OPEN' || !bounty.pr) {
      throw new Error('Invariante 1 violada: É necessário um PR aberto antes de realizar o merge.');
    }

    const mergedAt = new Date().toISOString();
    const updatedPr: PullRequest = {
      ...bounty.pr,
      merged: true,
      merged_at: mergedAt,
    };

    // Automação da Plataforma: processa pagamento imediato em USDC on-chain
    if (autoClaim && bounty.developer?.wallet_address) {
      const claim = await this.solanaService.signAndExecuteClaim(
        bountyId,
        bounty.developer.wallet_address,
        bounty.usdc_amount
      );

      await this.treasuryRepo.claimFunds(bounty.usdc_amount);

      const updatedBounty = await this.bountyRepo.update(bountyId, {
        pr: updatedPr,
        status: 'CLAIMED',
        merged_at: mergedAt,
        claimed_at: new Date().toISOString(),
        claim,
      });

      return { bounty: updatedBounty, claim };
    }

    // Fallback: transiciona para CLAIMABLE caso claim manual seja exigido
    const updatedBounty = await this.bountyRepo.update(bountyId, {
      pr: updatedPr,
      status: 'CLAIMABLE',
      merged_at: mergedAt,
    });

    return { bounty: updatedBounty };
  }

  /**
   * Liquidação Manual de Recompensa (Fallback do Estado 5)
   */
  async claimReward(
    bountyId: string,
    claimer: User
  ): Promise<{ bounty: Bounty; claim: Claim }> {
    const bounty = await this.bountyRepo.getById(bountyId);
    if (!bounty) throw new Error('Bounty não encontrada');

    if (bounty.status !== 'CLAIMABLE') {
      throw new Error(
        `Invariante 1 violada: Recompensa não está no estado CLAIMABLE. Estado atual: ${bounty.status}`
      );
    }

    if (bounty.developer_id && bounty.developer_id !== claimer.id) {
      throw new Error('Apenas o desenvolvedor responsável pela entrega pode reivindicar esta recompensa.');
    }

    if (Boolean(bounty.claimed_at) || Boolean(bounty.claim)) {
      throw new Error('Invariante 3 violada: Tentativa de Double-Claim detectada e bloqueada.');
    }

    const claim = await this.solanaService.signAndExecuteClaim(
      bountyId,
      claimer.wallet_address,
      bounty.usdc_amount
    );

    await this.treasuryRepo.claimFunds(bounty.usdc_amount);

    const updatedBounty = await this.bountyRepo.update(bountyId, {
      status: 'CLAIMED',
      claimed_at: new Date().toISOString(),
      claim,
    });

    return { bounty: updatedBounty, claim };
  }

  /**
   * Métricas do Mantenedor
   */
  async getMaintainerMetrics(
    _maintainerId?: string
  ): Promise<{
    treasury: Treasury;
    activeBounties: number;
    openForProposalsCount: number;
    inProgressBounties: number;
    awaitingMergeBounties: number;
    totalPaidUsdc: number;
  }> {
    const all = await this.bountyRepo.getAll();
    const treasury = await this.treasuryRepo.getTreasury();

    const activeBounties = all.filter(
      (b) => b.status !== 'CLAIMED' && b.status !== 'CANCELLED'
    ).length;
    const openForProposalsCount = all.filter(
      (b) => b.status === 'OPEN_FOR_PROPOSALS' || b.status === 'FUNDED'
    ).length;
    const inProgressBounties = all.filter(
      (b) => b.status === 'IN_PROGRESS' || b.status === 'ASSIGNED'
    ).length;
    const awaitingMergeBounties = all.filter((b) => b.status === 'PR_OPEN').length;
    const totalPaidUsdc = all
      .filter((b) => b.status === 'CLAIMED')
      .reduce((sum, b) => sum + b.usdc_amount, 0);

    return {
      treasury,
      activeBounties,
      openForProposalsCount,
      inProgressBounties,
      awaitingMergeBounties,
      totalPaidUsdc,
    };
  }

  /**
   * Métricas do Desenvolvedor
   */
  async getDeveloperMetrics(
    developerId: string
  ): Promise<{
    assignedCount: number;
    proposalsCount: number;
    inProgressCount: number;
    claimableCount: number;
    totalEarnedUsdc: number;
  }> {
    const devBounties = await this.bountyRepo.getByDeveloper(developerId);

    const proposalsCount = devBounties.filter((b) =>
      b.proposals?.some((p) => p.developer_id === developerId)
    ).length;

    const assignedCount = devBounties.filter(
      (b) =>
        b.developer_id === developerId &&
        (b.status === 'ASSIGNED' || b.status === 'IN_PROGRESS' || b.status === 'PR_OPEN')
    ).length;

    const inProgressCount = devBounties.filter(
      (b) => b.developer_id === developerId && b.status === 'IN_PROGRESS'
    ).length;

    const claimableCount = devBounties.filter(
      (b) => b.developer_id === developerId && b.status === 'CLAIMABLE'
    ).length;

    const totalEarnedUsdc = devBounties
      .filter((b) => b.developer_id === developerId && b.status === 'CLAIMED')
      .reduce((sum, b) => sum + b.usdc_amount, 0);

    return {
      assignedCount,
      proposalsCount,
      inProgressCount,
      claimableCount,
      totalEarnedUsdc,
    };
  }
}

