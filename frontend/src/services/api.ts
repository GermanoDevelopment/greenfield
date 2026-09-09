import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Suporte a Token JWT
export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    try {
      localStorage.setItem('greenfield_jwt', token);
    } catch {
      // Ignora erro se localStorage estiver bloqueado
    }
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    try {
      localStorage.removeItem('greenfield_jwt');
    } catch {
      // Ignora erro
    }
  }
}

// Inicializa token se já salvo
try {
  const savedToken = localStorage.getItem('greenfield_jwt');
  if (savedToken) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
  }
} catch {
  // Ignora
}

// Interfaces dos DTOs do Backend FastAPI
export interface HealthOut {
  status: string;
  service: string;
  version: string;
}

export interface ApiUserOut {
  id: number;
  github_id: number;
  username: string;
  avatar_url: string | null;
  wallet: string | null;
  role: 'ADMIN' | 'MAINTAINER' | 'CONTRIBUTOR';
  created_at: string;
}

export interface ApiRepositoryOut {
  id: number;
  project_id: number;
  github_owner: string;
  github_name: string;
  github_repo: string;
  description: string | null;
  default_branch: string;
  is_active: boolean;
  created_at: string;
}

export interface ApiGitHubIssueOut {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  author_username: string | null;
  labels: string[];
  has_bounty: boolean;
  bounty_id: number | null;
  bounty_status: string | null;
  bounty_points: number | null;
}

export interface ApiProjectOut {
  id: number;
  owner_id: number;
  github_repo: string;
  description: string | null;
  created_at: string;
  owner?: ApiUserOut;
  repositories: ApiRepositoryOut[];
}

export interface ApiBountyApplicantOut {
  id: number;
  bounty_id: number;
  user_id: number;
  proposal: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: string;
  user?: ApiUserOut;
}

export interface ApiBountyOut {
  id: number;
  project_id: number;
  repository_id: number | null;
  issuer_id: number;
  hunter_id: number | null;
  issue_url: string;
  issue_number: number | null;
  issue_title: string | null;
  issue_body: string | null;
  amount_usdc: number;
  points: number;
  status: 'OPEN' | 'ASSIGNED' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED';
  escrow_pda: string | null;
  pr_url: string | null;
  tx_signature: string | null;
  claimed_at: string | null;
  created_at: string;
  issuer?: ApiUserOut;
  hunter?: ApiUserOut;
  applicants?: ApiBountyApplicantOut[];
}

export interface ApiTrackedIssueOut {
  id: number;
  project_id: number;
  repository_id: number;
  issue_number: number;
  title: string;
  body: string | null;
  html_url: string;
  author_username: string | null;
  labels: string[];
  state: string;
  has_bounty: boolean;
  bounty_id: number | null;
  created_at: string;
  repository_name?: string | null;
}

export interface ApiAdminProjectCreate {
  github_repo: string;
  description?: string;
  default_branch?: string;
  owner_id?: number;
}

export interface ApiAdminProjectOut {
  id: number;
  owner_id: number;
  github_repo: string;
  description: string | null;
  created_at: string;
  total_repositories: number;
  total_issues: number;
  unrewarded_issues: number;
  bounties_count: number;
}

export interface AdminStatsOut {
  total_projects?: number;
  total_repositories: number;
  total_bounties: number;
  open_bounties?: number;
  submitted_bounties?: number;
  completed_bounties?: number;
  bounties_by_status?: Record<string, number>;
  total_points_allocated?: number;
  total_usdc_allocated: number;
  total_usdc_paid: number;
  total_users: number;
  pending_submissions?: number;
  unrewarded_issues?: number;
  total_tracked_issues?: number;
}

export interface ReviewSubmissionPayload {
  action: 'APPROVE' | 'REJECT';
  reason?: string;
  force_payout?: boolean;
}

export const greenfieldApi = {
  // Health
  getHealth: async (): Promise<HealthOut> => {
    const response = await apiClient.get<HealthOut>('/health');
    return response.data;
  },

  // Auth & Users
  getGithubLoginUrl: (state?: string): string => {
    const params = state ? `?state=${encodeURIComponent(state)}` : '';
    return `${API_BASE_URL}/auth/github/login${params}`;
  },
  getMe: async (): Promise<ApiUserOut> => {
    const response = await apiClient.get<ApiUserOut>('/auth/me');
    return response.data;
  },
  updateWallet: async (wallet: string): Promise<ApiUserOut> => {
    const response = await apiClient.patch<ApiUserOut>('/users/me', { wallet });
    return response.data;
  },
  listUsers: async (): Promise<ApiUserOut[]> => {
    const response = await apiClient.get<ApiUserOut[]>('/users');
    return response.data;
  },

  // Projects & Repositories
  listProjects: async (ownerId?: number): Promise<ApiProjectOut[]> => {
    const params = ownerId !== undefined ? { owner_id: ownerId } : {};
    const response = await apiClient.get<ApiProjectOut[]>('/projects', { params });
    return response.data;
  },
  getProject: async (projectId: number): Promise<ApiProjectOut> => {
    const response = await apiClient.get<ApiProjectOut>(`/projects/${projectId}`);
    return response.data;
  },
  createProject: async (data: { github_repo: string; description?: string }): Promise<ApiProjectOut> => {
    const response = await apiClient.post<ApiProjectOut>('/projects', data);
    return response.data;
  },
  listProjectRepositories: async (projectId: number): Promise<ApiRepositoryOut[]> => {
    const response = await apiClient.get<ApiRepositoryOut[]>(`/projects/${projectId}/repositories`);
    return response.data;
  },
  addRepository: async (
    projectId: number,
    data: { github_repo: string; description?: string; default_branch?: string }
  ): Promise<ApiRepositoryOut> => {
    const response = await apiClient.post<ApiRepositoryOut>(`/projects/${projectId}/repositories`, data);
    return response.data;
  },
  listRepositoryIssues: async (repositoryId: number): Promise<ApiGitHubIssueOut[]> => {
    const response = await apiClient.get<ApiGitHubIssueOut[]>(`/repositories/${repositoryId}/issues`);
    return response.data;
  },

  // Bounties
  listBounties: async (params?: {
    status?: string;
    project_id?: number;
    hunter_id?: number;
    repository_id?: number;
  }): Promise<ApiBountyOut[]> => {
    const response = await apiClient.get<ApiBountyOut[]>('/bounties', { params });
    return response.data;
  },
  getBounty: async (bountyId: number): Promise<ApiBountyOut> => {
    const response = await apiClient.get<ApiBountyOut>(`/bounties/${bountyId}`);
    return response.data;
  },
  createBounty: async (data: {
    project_id: number;
    issue_url: string;
    points?: number;
    amount_usdc?: number;
    repository_id?: number;
    issue_number?: number;
    issue_title?: string;
    issue_body?: string;
    escrow_pda?: string;
  }): Promise<ApiBountyOut> => {
    const response = await apiClient.post<ApiBountyOut>('/bounties', data);
    return response.data;
  },
  applyToBounty: async (bountyId: number, proposal?: string): Promise<ApiBountyApplicantOut> => {
    const response = await apiClient.post<ApiBountyApplicantOut>(`/bounties/${bountyId}/apply`, {
      proposal: proposal || '',
    });
    return response.data;
  },
  listBountyApplicants: async (bountyId: number): Promise<ApiBountyApplicantOut[]> => {
    const response = await apiClient.get<ApiBountyApplicantOut[]>(`/bounties/${bountyId}/applicants`);
    return response.data;
  },
  acceptBountyApplicant: async (bountyId: number, applicantId: number): Promise<ApiBountyOut> => {
    const response = await apiClient.post<ApiBountyOut>(
      `/bounties/${bountyId}/applicants/${applicantId}/accept`
    );
    return response.data;
  },
  updateBountyReward: async (bountyId: number, points: number): Promise<ApiBountyOut> => {
    const response = await apiClient.patch<ApiBountyOut>(`/bounties/${bountyId}/reward`, { points });
    return response.data;
  },
  submitBounty: async (bountyId: number, prUrl: string): Promise<ApiBountyOut> => {
    const response = await apiClient.post<ApiBountyOut>(`/bounties/${bountyId}/submit`, {
      pr_url: prUrl,
    });
    return response.data;
  },
  rejectSubmission: async (bountyId: number): Promise<ApiBountyOut> => {
    const response = await apiClient.post<ApiBountyOut>(`/bounties/${bountyId}/reject-submission`);
    return response.data;
  },
  completeBounty: async (bountyId: number): Promise<ApiBountyOut> => {
    const response = await apiClient.post<ApiBountyOut>(`/bounties/${bountyId}/complete`);
    return response.data;
  },
  cancelBounty: async (bountyId: number): Promise<{ status: string }> => {
    const response = await apiClient.post<{ status: string }>(`/bounties/${bountyId}/cancel`);
    return response.data;
  },

  // Admin Endpoints
  admin: {
    getStats: async (): Promise<AdminStatsOut> => {
      const response = await apiClient.get<AdminStatsOut>('/admin/stats');
      return response.data;
    },
    getProjects: async (): Promise<ApiAdminProjectOut[]> => {
      const response = await apiClient.get<ApiAdminProjectOut[]>('/admin/projects');
      return response.data;
    },
    createProject: async (data: ApiAdminProjectCreate): Promise<ApiAdminProjectOut> => {
      const response = await apiClient.post<ApiAdminProjectOut>('/admin/projects', data);
      return response.data;
    },
    updateProject: async (id: number, data: { description?: string }): Promise<ApiAdminProjectOut> => {
      const response = await apiClient.patch<ApiAdminProjectOut>(`/admin/projects/${id}`, data);
      return response.data;
    },
    deleteProject: async (id: number): Promise<void> => {
      await apiClient.delete(`/admin/projects/${id}`);
    },
    addRepository: async (data: {
      project_id: number;
      github_repo: string;
      description?: string;
      default_branch?: string;
    }): Promise<ApiRepositoryOut> => {
      const response = await apiClient.post<ApiRepositoryOut>('/admin/repositories', data);
      return response.data;
    },
    syncRepository: async (
      repositoryId: number
    ): Promise<{
      repository_id: number;
      repository: string;
      total_synced: number;
      new_issues: number;
    }> => {
      const response = await apiClient.post(`/admin/repositories/${repositoryId}/sync`);
      return response.data;
    },
    getUnrewardedIssues: async (params?: {
      repository_id?: number;
      project_id?: number;
    }): Promise<ApiTrackedIssueOut[]> => {
      const response = await apiClient.get<ApiTrackedIssueOut[]>('/admin/unrewarded-issues', {
        params,
      });
      return response.data;
    },
    assignReward: async (issueId: number, points: number): Promise<ApiBountyOut> => {
      const response = await apiClient.post<ApiBountyOut>(
        `/admin/unrewarded-issues/${issueId}/assign-reward`,
        { points }
      );
      return response.data;
    },
    reviewSubmission: async (
      bountyId: number,
      data: ReviewSubmissionPayload
    ): Promise<ApiBountyOut> => {
      const response = await apiClient.post<ApiBountyOut>(`/admin/bounties/${bountyId}/review`, data);
      return response.data;
    },
  },
};

// Aliases retrocompatíveis
export const bountiesApi = {
  getBounties: () => greenfieldApi.listBounties(),
  getHealth: () => greenfieldApi.getHealth(),
};
