import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  GitFork,
  ExternalLink,
  Search,
  Plus,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { greenfieldApi, type ApiRepositoryOut } from '../../services/api';

export const RepositoriesPage: React.FC = () => {
  const { isBackendConnected, currentUser } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState<ApiRepositoryOut[]>([]);

  useEffect(() => {
    async function loadRepos() {
      setLoading(true);
      try {
        if (isBackendConnected) {
          const projects = await greenfieldApi.listProjects();
          const allRepos = projects.flatMap((p) => p.repositories || []);
          // Se o backend não tiver repositórios cadastrados ainda, use fallback representativo
          if (allRepos.length > 0) {
            setRepos(allRepos);
          } else {
            setRepos([
              {
                id: 1,
                project_id: 1,
                github_owner: 'carcaras',
                github_name: 'solinpy',
                github_repo: 'carcaras/solinpy',
                description: 'Biblioteca Solana Python para smart contracts, pagamentos e PDAs em Devnet.',
                default_branch: 'main',
                is_active: true,
                created_at: new Date().toISOString(),
              },
              {
                id: 2,
                project_id: 1,
                github_owner: 'GermanoDevelopment',
                github_name: 'greenfield',
                github_repo: 'GermanoDevelopment/greenfield',
                description: 'Protocolo descentralizado de incentivos a desenvolvedores open source.',
                default_branch: 'develop',
                is_active: true,
                created_at: new Date().toISOString(),
              },
            ]);
          }
        } else {
          // Mock / Fallback
          setRepos([
            {
              id: 1,
              project_id: 1,
              github_owner: 'carcaras',
              github_name: 'solinpy',
              github_repo: 'carcaras/solinpy',
              description: 'Biblioteca Solana Python para smart contracts, pagamentos e PDAs em Devnet.',
              default_branch: 'main',
              is_active: true,
              created_at: new Date().toISOString(),
            },
            {
              id: 2,
              project_id: 1,
              github_owner: 'GermanoDevelopment',
              github_name: 'greenfield',
              github_repo: 'GermanoDevelopment/greenfield',
              description: 'Protocolo descentralizado de incentivos a desenvolvedores open source.',
              default_branch: 'develop',
              is_active: true,
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error('Erro ao carregar repositórios:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRepos();
  }, [isBackendConnected]);

  const filteredRepos = repos.filter(
    (r) =>
      r.github_repo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252E24] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <FolderGit2 className="w-8 h-8 text-[#28B110]" />
            Repositórios Cadastrados
          </h1>
          <p className="text-sm text-[#889887] mt-1">
            Repositórios GitHub sincronizados para tracking de issues, pontuação e recompensas USDC na rede Solana.
          </p>
        </div>

        {['ADMIN', 'MAINTAINER', 'admin', 'maintainer'].includes(currentUser.role) && (
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#28B110] text-[#101410] font-bold text-sm hover:brightness-110 transition-all shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Repositório (Admin)
          </Link>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#687867]" />
          <input
            type="text"
            placeholder="Buscar por nome do repositório ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#161C15] border border-[#252E24] text-sm text-[#D2DFD1] placeholder-[#687867] focus:outline-none focus:border-[#28B110]"
          />
        </div>
      </div>

      {/* Grid of Repositories */}
      {loading ? (
        <div className="text-center py-16 text-[#889887]">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#28B110] mb-3"></div>
          <p className="text-sm">Carregando repositórios registrados...</p>
        </div>
      ) : filteredRepos.length === 0 ? (
        <div className="text-center py-16 bg-[#161C15] rounded-2xl border border-[#252E24] p-8">
          <FolderGit2 className="w-12 h-12 text-[#687867] mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">Nenhum repositório encontrado</h3>
          <p className="text-sm text-[#889887] mt-1">
            Nenhum repositório corresponde à busca atual.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              className="bg-[#161C15] border border-[#252E24] hover:border-[#28B110]/50 rounded-2xl p-6 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#1D281C] border border-[#28B110]/30 text-[#28B110]">
                      <GitFork className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-[#28B110] transition-colors">
                        {repo.github_repo}
                      </h3>
                      <span className="text-xs font-mono text-[#889887]">
                        Branch padrão: <span className="text-[#D2DFD1]">{repo.default_branch}</span>
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-[#182618] text-[#28B110] border border-[#28B110]/40">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ativo
                  </span>
                </div>

                <p className="text-sm text-[#9EAE9D] mb-5 line-clamp-2">
                  {repo.description || 'Sem descrição cadastrada.'}
                </p>
              </div>

              <div className="pt-4 border-t border-[#202720] flex items-center justify-between gap-3">
                <a
                  href={`https://github.com/${repo.github_repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#889887] hover:text-[#D2DFD1] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  GitHub Repo
                </a>

                <button
                  onClick={() => navigate(`/repositories/${repo.id}/issues`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1D2B1A] hover:bg-[#28B110] text-[#28B110] hover:text-[#101410] font-semibold text-xs transition-all border border-[#28B110]/40 cursor-pointer"
                >
                  <span>Ver Issues & Bounties</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RepositoriesPage;
