import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { Bounty, Claim, Repository, Treasury, User } from '../../core/domain/types';
import { HybridBountyRepository } from '../../infrastructure/repositories/HybridBountyRepository';
import { LocalStorageTreasuryRepository } from '../../infrastructure/repositories/LocalStorageTreasuryRepository';
import { UserRepository, GUEST_USER } from '../../infrastructure/repositories/UserRepository';
import { GitHubService } from '../../infrastructure/services/GitHubService';
import { SolanaService } from '../../infrastructure/solana/solanaService';
import { BountyUseCases } from '../../core/usecases/bountyUseCases';
import { MOCK_USERS } from '../../infrastructure/data/mockData';
import { greenfieldApi, type ApiUserOut, setAuthToken } from '../../services/api';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
  repositories: Repository[];
  bounties: Bounty[];
  treasury: Treasury | null;
  loading: boolean;
  isBackendConnected: boolean;
  isAuthenticated: boolean;
  authInitialized: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, username?: string) => Promise<User>;
  logout: () => void;
  bountyUseCases: BountyUseCases;
  gitHubService: GitHubService;
  solanaService: SolanaService;
  refreshData: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  toggleRepositoryApproval: (repoId: string, approved: boolean) => Promise<Repository>;
  createBounty: (params: {
    issueId: string;
    repositoryId: string;
    points: number;
    developerId?: string;
  }) => Promise<Bounty>;
  submitProposal: (
    bountyId: string,
    coverLetter: string,
    estimatedDays: number
  ) => Promise<Bounty>;
  acceptProposalAndAssign: (bountyId: string, proposalId: string) => Promise<Bounty>;
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
  mergePullRequest: (bountyId: string) => Promise<{ bounty: Bounty; claim?: Claim }>;
  claimReward: (bountyId: string) => Promise<{ bounty: Bounty; claim: Claim }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const bountyRepo = useMemo(() => new HybridBountyRepository(), []);
  const treasuryRepo = useMemo(() => new LocalStorageTreasuryRepository(), []);
  const userRepo = useMemo(() => new UserRepository(), []);
  const gitHubService = useMemo(() => new GitHubService(), []);
  const solanaService = useMemo(() => new SolanaService(), []);

  const bountyUseCases = useMemo(
    () => new BountyUseCases(bountyRepo, treasuryRepo, solanaService, gitHubService),
    [bountyRepo, treasuryRepo, solanaService, gitHubService]
  );

  const apiUserToUser = useCallback((apiUser: ApiUserOut): User => {
    return {
      id: String(apiUser.id),
      github_id: apiUser.github_id ?? null,
      github_username: apiUser.username,
      email: apiUser.email || null,
      name: apiUser.username,
      avatar_url:
        apiUser.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          apiUser.username
        )}&background=28B110&color=fff`,
      wallet_address: apiUser.wallet || '',
      role: apiUser.role,
      created_at: apiUser.created_at,
    };
  }, []);

  const [currentUser, setCurrentUserState] = useState<User>(userRepo.getCurrentUser());
  const [availableUsers, setAvailableUsers] = useState<User[]>(Object.values(MOCK_USERS));
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [treasury, setTreasury] = useState<Treasury | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('greenfield_jwt');
    } catch {
      return false;
    }
  });
  const [authInitialized, setAuthInitialized] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('greenfield_jwt');
    } catch {
      return true;
    }
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const openLoginModal = useCallback(() => setIsLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const connected = await bountyRepo.checkConnectivity();
      setIsBackendConnected(connected);

      const [allBounties, currTreasury, users, repos] = await Promise.all([
        bountyRepo.getAll(),
        treasuryRepo.getTreasury(),
        userRepo.getAllUsers(),
        gitHubService.listRepositories(),
      ]);
      setBounties(allBounties);
      setTreasury(currTreasury);

      let mergedUsers = users;
      if (connected) {
        try {
          const apiUsers = await greenfieldApi.listUsers();
          if (apiUsers && apiUsers.length > 0) {
            mergedUsers = apiUsers.map(apiUserToUser);
          }
        } catch {
          // Mantém users locais em caso de falha de listagem
        }
      }
      setAvailableUsers(mergedUsers);
      setRepositories(repos);
    } finally {
      setLoading(false);
    }
  }, [bountyRepo, treasuryRepo, userRepo, gitHubService, apiUserToUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await greenfieldApi.login({ email, password });
      const user = apiUserToUser(res.user);
      userRepo.setCurrentUser(user);
      setCurrentUserState(user);
      setIsAuthenticated(true);
      await refreshData();
      return user;
    },
    [userRepo, apiUserToUser, refreshData]
  );

  const register = useCallback(
    async (email: string, password: string, username?: string) => {
      const res = await greenfieldApi.register({ email, password, username });
      const user = apiUserToUser(res.user);
      userRepo.setCurrentUser(user);
      setCurrentUserState(user);
      setIsAuthenticated(true);
      await refreshData();
      return user;
    },
    [userRepo, apiUserToUser, refreshData]
  );

  const logout = useCallback(() => {
    greenfieldApi.logout();
    setIsAuthenticated(false);
    userRepo.setCurrentUser(GUEST_USER);
    setCurrentUserState(GUEST_USER);
  }, [userRepo]);

  // Checa token existente na inicialização
  useEffect(() => {
    const checkAuthOnBoot = async () => {
      const token = localStorage.getItem('greenfield_jwt');
      if (token) {
        try {
          const me = await greenfieldApi.getMe();
          const user = apiUserToUser(me);
          userRepo.setCurrentUser(user);
          setCurrentUserState(user);
          setIsAuthenticated(true);
        } catch {
          setAuthToken(null);
          setIsAuthenticated(false);
          userRepo.setCurrentUser(GUEST_USER);
          setCurrentUserState(GUEST_USER);
        } finally {
          setAuthInitialized(true);
        }
      } else {
        setIsAuthenticated(false);
        userRepo.setCurrentUser(GUEST_USER);
        setCurrentUserState(GUEST_USER);
        setAuthInitialized(true);
      }
    };
    checkAuthOnBoot();
  }, [userRepo, apiUserToUser]);

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
    if (!isAuthenticated) {
      userRepo.setCurrentUser(GUEST_USER);
      setCurrentUserState(GUEST_USER);
    }
    await refreshData();
  }, [bountyRepo, treasuryRepo, userRepo, refreshData, isAuthenticated]);

  const toggleRepositoryApproval = useCallback(
    async (repoId: string, approved: boolean) => {
      const updated = await bountyUseCases.toggleRepositoryRoundApproval(
        currentUser,
        repoId,
        approved
      );
      await refreshData();
      return updated;
    },
    [bountyUseCases, currentUser, refreshData]
  );

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

  const submitProposal = useCallback(
    async (bountyId: string, coverLetter: string, estimatedDays: number) => {
      const updated = await bountyUseCases.submitProposal({
        bountyId,
        developer: currentUser,
        coverLetter,
        estimatedDays,
      });
      await refreshData();
      return updated;
    },
    [bountyUseCases, currentUser, refreshData]
  );

  const acceptProposalAndAssign = useCallback(
    async (bountyId: string, proposalId: string) => {
      const updated = await bountyUseCases.acceptProposalAndAssign(
        bountyId,
        proposalId,
        currentUser
      );
      await refreshData();
      return updated;
    },
    [bountyUseCases, currentUser, refreshData]
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
      const result = await bountyUseCases.mergePullRequest(bountyId, true);
      await refreshData();
      return result;
    },
    [bountyUseCases, refreshData]
  );

  const claimReward = useCallback(
    async (bountyId: string) => {
      const result = await bountyUseCases.claimReward(bountyId, currentUser);
      await refreshData();
      return result;
    },
    [bountyUseCases, currentUser, refreshData]
  );

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers,
        repositories,
        bounties,
        treasury,
        loading,
        isBackendConnected,
        isAuthenticated,
        authInitialized,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        login,
        register,
        logout,
        bountyUseCases,
        gitHubService,
        solanaService,
        refreshData,
        resetToDefaults,
        toggleRepositoryApproval,
        createBounty,
        submitProposal,
        acceptProposalAndAssign,
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

