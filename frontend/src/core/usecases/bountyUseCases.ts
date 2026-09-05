import type {
  Bounty,
  BountyStatus,
  Claim,
  PullRequest,
  Treasury,
  User,
} from '../domain/types';
import { pointsToUsdc } from '../domain/types';
import type {
  IBountyRepository,
  ISolanaService,
  ITreasuryRepository,
} from '../domain/ports';

export class BountyUseCases {
  private bountyRepo: IBountyRepository;
  private treasuryRepo: ITreasuryRepository;
  private solanaService: ISolanaService;

  constructor(
    bountyRepo: IBountyRepository,
    treasuryRepo: ITreasuryRepository,
    solanaService: ISolanaService
  ) {
    this.bountyRepo = bountyRepo;
    this.treasuryRepo = treasuryRepo;
    this.solanaService = solanaService;
  }

  /**
   * Estado 1: Criação da Bounty
   * Invariante 4: Tesouro solvente (bountyPoints/100 <= treasury.available_usdc)
   */
  async createBounty(params: {
    issueId: string;
    repositoryId: string;
    maintainer: User;
    points: number;
    developer?: User;
  }): Promise<Bounty> {
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

    const initialStatus: BountyStatus = params.developer ? 'ASSIGNED' : 'FUNDED';

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
    });
  }

  /**
   * Estado 2: Aceitação e atribuição ao desenvolvedor
   * Invariante 2: Valor imutável após aceitação
   */
  async assignDeveloper(bountyId: string, developer: User): Promise<Bounty> {
    const bounty = await this.bountyRepo.getById(bountyId);
    if (!bounty) throw new Error('Bounty não encontrada');

    if (bounty.status !== 'FUNDED' && bounty.status !== 'ASSIGNED') {
      throw new Error(`Não é possível atribuir desenvolvedor no estado ${bounty.status}.`);
    }

    return await this.bountyRepo.update(bountyId, {
      developer_id: developer.id,
      developer,
      status: 'ASSIGNED',
      accepted_at: new Date().toISOString(),
    });
  }

  /**
   * Estado 3: Início de Desenvolvimento
   */
  async startWork(bountyId: string): Promise<Bounty> {
    const bounty = await this.bountyRepo.getById(bountyId);
    if (!bounty) throw new Error('Bounty não encontrada');

    return await this.bountyRepo.update(bountyId, {
      status: 'IN_PROGRESS',
    });
  }

  /**
   * Estado 3: Desenvolvedor abre Pull Request
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
   * Estado 4: Verificação & Merge
   * Invariante 1: Merge obrigatório (PR aberto != recompensa liberada; PR merged = condição necessária)
   */
  async mergePullRequest(bountyId: string): Promise<Bounty> {
    const bounty = await this.bountyRepo.getById(bountyId);
    if (!bounty) throw new Error('Bounty não encontrada');

    if (bounty.status !== 'PR_OPEN' && !bounty.pr) {
      throw new Error('Invariante 1 violada: É necessário um PR aberto antes de realizar o merge.');
    }

    const mergedAt = new Date().toISOString();
    const updatedPr: PullRequest = {
      ...bounty.pr!,
      merged: true,
      merged_at: mergedAt,
    };

    // Apenas após confirmação do merge o status vira CLAIMABLE
    return await this.bountyRepo.update(bountyId, {
      pr: updatedPr,
      status: 'CLAIMABLE',
      merged_at: mergedAt,
    });
  }

  /**
   * Estado 5: Claim da Recompensa
   * Invariante 3: Prevenção de Double-Claim (claimed == false obrigatório)
   */
  async claimReward(
    bountyId: string,
    developerWallet: string
  ): Promise<{ bounty: Bounty; claim: Claim }> {
    const bounty = await this.bountyRepo.getById(bountyId);
    if (!bounty) throw new Error('Bounty não encontrada');

    // Invariante 1: Confere se está CLAIMABLE
    if (bounty.status !== 'CLAIMABLE') {
      throw new Error(
        `Invariante 1 violada: Recompensa não está no estado CLAIMABLE. Estado atual: ${bounty.status}`
      );
    }

    // Invariante 3: Double-Claim check
    if (Boolean(bounty.claimed_at) || Boolean(bounty.claim)) {
      throw new Error('Invariante 3 violada: Tentativa de Double-Claim detectada e bloqueada.');
    }

    // Executa assinatura de claim na Solana (Devnet)
    const claim = await this.solanaService.signAndExecuteClaim(
      bountyId,
      developerWallet,
      bounty.usdc_amount
    );

    // Deduz do tesouro
    await this.treasuryRepo.claimFunds(bounty.usdc_amount);

    const updatedBounty = await this.bountyRepo.update(bountyId, {
      status: 'CLAIMED',
      claimed_at: new Date().toISOString(),
      claim,
    });

    return { bounty: updatedBounty, claim };
  }

  /**
   * Métricas do Mantenedor (Seção 12)
   */
  async getMaintainerMetrics(
    _maintainerId?: string
  ): Promise<{
    treasury: Treasury;
    activeBounties: number;
    inProgressBounties: number;
    awaitingMergeBounties: number;
    totalPaidUsdc: number;
  }> {
    const all = await this.bountyRepo.getAll();
    const treasury = await this.treasuryRepo.getTreasury();

    const activeBounties = all.filter(
      (b) => b.status !== 'CLAIMED' && b.status !== 'CANCELLED'
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
      inProgressBounties,
      awaitingMergeBounties,
      totalPaidUsdc,
    };
  }

  /**
   * Métricas do Desenvolvedor (Seção 12)
   */
  async getDeveloperMetrics(
    developerId: string
  ): Promise<{
    assignedCount: number;
    inProgressCount: number;
    claimableCount: number;
    totalEarnedUsdc: number;
  }> {
    const devBounties = await this.bountyRepo.getByDeveloper(developerId);

    const assignedCount = devBounties.filter(
      (b) => b.status === 'ASSIGNED' || b.status === 'IN_PROGRESS' || b.status === 'PR_OPEN'
    ).length;
    const inProgressCount = devBounties.filter((b) => b.status === 'IN_PROGRESS').length;
    const claimableCount = devBounties.filter((b) => b.status === 'CLAIMABLE').length;
    const totalEarnedUsdc = devBounties
      .filter((b) => b.status === 'CLAIMED')
      .reduce((sum, b) => sum + b.usdc_amount, 0);

    return {
      assignedCount,
      inProgressCount,
      claimableCount,
      totalEarnedUsdc,
    };
  }
}
