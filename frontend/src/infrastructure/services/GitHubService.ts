import type { IGitHubService } from '../../core/domain/ports';
import type { Issue, Repository } from '../../core/domain/types';
import { MOCK_ISSUES, MOCK_REPOSITORIES } from '../data/mockData';

export class GitHubService implements IGitHubService {
  async listRepositories(): Promise<Repository[]> {
    return MOCK_REPOSITORIES;
  }

  async listIssues(repositoryId?: string): Promise<Issue[]> {
    if (!repositoryId) return MOCK_ISSUES;
    return MOCK_ISSUES.filter((i) => i.repository_id === repositoryId);
  }

  async getIssueById(issueId: string): Promise<Issue | null> {
    return MOCK_ISSUES.find((i) => i.id === issueId) || null;
  }
}
