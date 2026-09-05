import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { Bounty, Claim, Treasury, User } from '../../core/domain/types';
import { LocalStorageBountyRepository } from '../../infrastructure/repositories/LocalStorageBountyRepository';
import { LocalStorageTreasuryRepository } from '../../infrastructure/repositories/LocalStorageTreasuryRepository';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { GitHubService } from '../../infrastructure/services/GitHubService';
import { SolanaService } from '../../infrastructure/solana/solanaService';
import { BountyUseCases } from '../../core/usecases/bountyUseCases';
import { MOCK_USERS } from '../../infrastructure/data/mockData';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
  bounties: Bounty[];
  treasury: Treasury | null;
  loading: boolean;
  bountyUseCases: BountyUseCases;
  gitHubService: GitHubService;
  solanaService: SolanaService;
  refreshData: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  createBounty: (params: {
    issueId: string;
    repositoryId: string;
    points: number;
    developerId?: string;
  }) => Promise<Bounty>;
  assignDeveloper: (bountyId: string, developerId: string) => Promise<Bounty>;
  openPullRequest: (
    bountyId: string,
    prData: {
      github_pr_id: number;
      number: number;
      title: string;
      url: string;
      author_github_username: string;
    }
  ) => Promise<Bounty>;
  mergePullRequest: (bountyId: string) => Promise<Bounty>;
  claimReward: (bountyId: string) => Promise<{ bounty: Bounty; claim: Claim }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const bountyRepo = useMemo(() => new LocalStorageBountyRepository(), []);
  const treasuryRepo = useMemo(() => new LocalStorageTreasuryRepository(), []);
  const userRepo = useMemo(() => new UserRepository(), []);
  const gitHubService = useMemo(() => new GitHubService(), []);
  const solanaService = useMemo(() => new SolanaService(), []);

  const bountyUseCases = useMemo(
    () => new BountyUseCases(bountyRepo, treasuryRepo, solanaService),
    [bountyRepo, treasuryRepo, solanaService]
  );

  const [currentUser, setCurrentUserState] = useState<User>(userRepo.getCurrentUser());
  const [availableUsers, setAvailableUsers] = useState<User[]>(Object.values(MOCK_USERS));
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [treasury, setTreasury] = useState<Treasury | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [allBounties, currTreasury, users] = await Promise.all([
        bountyRepo.getAll(),
        treasuryRepo.getTreasury(),
        userRepo.getAllUsers(),
      ]);
      setBounties(allBounties);
      setTreasury(currTreasury);
      setAvailableUsers(users);
    } finally {
      setLoading(false);
    }
  }, [bountyRepo, treasuryRepo, userRepo]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const setCurrentUser = useCallback(
    (user: User) => {
      userRepo.setCurrentUser(user);
      setCurrentUserState(user);
    },
    [userRepo]
  );

  const resetToDefaults = useCallback(async () => {
    bountyRepo.reset();
    await treasuryRepo.resetToDefault();
    userRepo.setCurrentUser(MOCK_USERS.maintainer);
    setCurrentUserState(MOCK_USERS.maintainer);
    await refreshData();
  }, [bountyRepo, treasuryRepo, userRepo, refreshData]);

  const createBounty = useCallback(
    async (params: {
      issueId: string;
      repositoryId: string;
      points: number;
      developerId?: string;
    }) => {
      const dev = params.developerId
        ? availableUsers.find((u) => u.id === params.developerId)
        : undefined;

      const created = await bountyUseCases.createBounty({
        issueId: params.issueId,
        repositoryId: params.repositoryId,
        maintainer: currentUser,
        points: params.points,
        developer: dev,
      });

      await refreshData();
      return created;
    },
    [bountyUseCases, currentUser, availableUsers, refreshData]
  );

  const assignDeveloper = useCallback(
    async (bountyId: string, developerId: string) => {
      const dev = availableUsers.find((u) => u.id === developerId);
      if (!dev) throw new Error('Desenvolvedor não encontrado.');

      const updated = await bountyUseCases.assignDeveloper(bountyId, dev);
      await refreshData();
      return updated;
    },
    [bountyUseCases, availableUsers, refreshData]
  );

  const openPullRequest = useCallback(
    async (
      bountyId: string,
      prData: {
        github_pr_id: number;
        number: number;
        title: string;
        url: string;
        author_github_username: string;
      }
    ) => {
      const updated = await bountyUseCases.openPullRequest(bountyId, prData);
      await refreshData();
      return updated;
    },
    [bountyUseCases, refreshData]
  );

  const mergePullRequest = useCallback(
    async (bountyId: string) => {
      const updated = await bountyUseCases.mergePullRequest(bountyId);
      await refreshData();
      return updated;
    },
    [bountyUseCases, refreshData]
  );

  const claimReward = useCallback(
    async (bountyId: string) => {
      const result = await bountyUseCases.claimReward(
        bountyId,
        currentUser.wallet_address
      );
      await refreshData();
      return result;
    },
    [bountyUseCases, currentUser.wallet_address, refreshData]
  );

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers,
        bounties,
        treasury,
        loading,
        bountyUseCases,
        gitHubService,
        solanaService,
        refreshData,
        resetToDefaults,
        createBounty,
        assignDeveloper,
        openPullRequest,
        mergePullRequest,
        claimReward,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser utilizado dentro de um AppProvider');
  }
  return context;
};
