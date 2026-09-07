import type { IGitHubService } from '../../core/domain/ports';
import type { Issue, Repository } from '../../core/domain/types';
import { MOCK_ISSUES, MOCK_REPOSITORIES } from '../data/mockData';

const REPOS_STORAGE_KEY = 'greenfield_repos_v1';

export class GitHubService implements IGitHubService {
  private getRepositoriesStore(): Repository[] {
    try {
      const raw = localStorage.getItem(REPOS_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(REPOS_STORAGE_KEY, JSON.stringify(MOCK_REPOSITORIES));
        return MOCK_REPOSITORIES;
      }
      return JSON.parse(raw);
    } catch {
      return MOCK_REPOSITORIES;
    }
  }

  private saveRepositoriesStore(repos: Repository[]): void {
    try {
      localStorage.setItem(REPOS_STORAGE_KEY, JSON.stringify(repos));
    } catch (e) {
      console.warn('LocalStorage save failed for repos:', e);
    }
  }

  async listRepositories(): Promise<Repository[]> {
    return this.getRepositoriesStore();
  }

  async listIssues(repositoryId?: string): Promise<Issue[]> {
    if (!repositoryId) return MOCK_ISSUES;
    return MOCK_ISSUES.filter((i) => i.repository_id === repositoryId);
  }

  async getIssueById(issueId: string): Promise<Issue | null> {
    return MOCK_ISSUES.find((i) => i.id === issueId) || null;
  }

  async setRepositoryRoundStatus(repoId: string, approved: boolean): Promise<Repository> {
    const repos = this.getRepositoriesStore();
    const index = repos.findIndex((r) => r.id === repoId);
    if (index === -1) throw new Error(`Repositório ${repoId} não encontrado.`);

    repos[index] = {
      ...repos[index],
      approved_for_round: approved,
    };

    this.saveRepositoriesStore(repos);
    return repos[index];
  }

  async assignIssueToDeveloper(
    _repoId: string,
    _issueNumber: number,
    _githubUsername: string
  ): Promise<boolean> {
    // Simula a latência de chamada de rede da API REST do GitHub (POST /repos/{owner}/{repo}/issues/{issue_number}/assignees)
    await new Promise((resolve) => setTimeout(resolve, 600));
    return true;
  }
}

