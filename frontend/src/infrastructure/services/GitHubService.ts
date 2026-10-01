import type { IGitHubService } from '../../core/domain/ports';
import type { Issue, Repository } from '../../core/domain/types';
import { greenfieldApi } from '../../services/api';

export class GitHubService implements IGitHubService {
  async listRepositories(): Promise<Repository[]> {
    try {
      const projects = await greenfieldApi.listProjects();
      const repos: Repository[] = [];
      for (const project of projects) {
        if (project.repositories && project.repositories.length > 0) {
          for (const r of project.repositories) {
            repos.push({
              id: String(r.id),
              github_repository_id: r.id,
              owner: r.github_owner,
              name: r.github_name,
              github_url: `https://github.com/${r.github_repo}`,
              maintainer_user_id: String(project.owner_id),
              default_branch: r.default_branch,
              approved_for_round: r.is_active,
            });
          }
        } else {
          const parts = project.github_repo.split('/');
          repos.push({
            id: String(project.id),
            github_repository_id: project.id,
            owner: parts[0] || 'owner',
            name: parts[1] || project.github_repo,
            github_url: `https://github.com/${project.github_repo}`,
            maintainer_user_id: String(project.owner_id),
            default_branch: 'main',
            approved_for_round: true,
          });
        }
      }
      return repos;
    } catch (err) {
      console.warn('Erro ao carregar repositórios da API:', err);
      return [];
    }
  }

  async listIssues(repositoryId?: string): Promise<Issue[]> {
    try {
      if (!repositoryId) {
        const repos = await this.listRepositories();
        const issuesArrays = await Promise.all(
          repos.map((r) => this.listIssues(r.id))
        );
        return issuesArrays.flat();
      }
      const numericId = parseInt(repositoryId.replace(/\D/g, ''), 10);
      if (isNaN(numericId)) return [];
      const apiIssues = await greenfieldApi.listRepositoryIssues(numericId);
      return apiIssues.map((i) => ({
        id: `issue-${repositoryId}-${i.number}`,
        github_issue_id: i.number,
        repository_id: repositoryId,
        number: i.number,
        title: i.title,
        description: i.body || '',
        url: i.html_url,
        status: i.state.toUpperCase() === 'CLOSED' ? 'CLOSED' : 'OPEN',
      }));
    } catch (err) {
      console.warn('Erro ao carregar issues da API:', err);
      return [];
    }
  }

  async getIssueById(issueId: string): Promise<Issue | null> {
    try {
      const issues = await this.listIssues();
      return (
        issues.find(
          (i) => i.id === issueId || String(i.github_issue_id) === issueId
        ) || null
      );
    } catch {
      return null;
    }
  }

  async setRepositoryRoundStatus(
    repoId: string,
    approved: boolean
  ): Promise<Repository> {
    const repos = await this.listRepositories();
    const repo = repos.find((r) => r.id === repoId);
    if (!repo) throw new Error(`Repositório ${repoId} não encontrado.`);
    return {
      ...repo,
      approved_for_round: approved,
    };
  }

  async assignIssueToDeveloper(
    _repoId: string,
    _issueNumber: number,
    _githubUsername: string
  ): Promise<boolean> {
    return true;
  }
}

