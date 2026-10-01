import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Compass,
  LayoutDashboard,
  FolderGit2,
  ListTodo,
  ArrowLeft,
  Home,
} from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useApp();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-[#121712] border border-[#252E24] rounded-3xl p-6 sm:p-10 text-center shadow-2xl space-y-6 relative overflow-hidden">
        {/* Background glow esmeralda */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#28B110]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Badge 404 */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1A261A] text-[#28B110] border border-[#28B110]/40 text-xs font-mono font-bold tracking-widest uppercase shadow-sm">
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Erro 404 • Rota Inexistente</span>
        </div>

        {/* Visual 404 Grande */}
        <div className="relative py-2">
          <span className="text-7xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-[#D9EED6] via-[#28B110] to-[#122413] select-none block leading-none">
            404
          </span>
          <p className="text-xs font-mono text-[#889887] mt-2">
            Coordenadas inválidas:{' '}
            <span className="text-[#28B110] bg-[#161C15] px-2 py-0.5 rounded border border-[#252E24]">
              {location.pathname}
            </span>
          </p>
        </div>

        {/* Textos Informativos */}
        <div className="space-y-2 max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Perdido no Espaço da Rede?
          </h1>
          <p className="text-xs sm:text-sm text-[#889887] leading-relaxed">
            A página ou recurso solicitado não foi encontrado no ecossistema Greenfield. Verifique a URL digitada ou retorne com segurança.
          </p>
        </div>

        {/* Sugestões de Navegação */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#1B261A] border border-[#28B110]/30 hover:border-[#28B110] text-xs font-semibold text-white transition-all group cursor-pointer"
          >
            {isAuthenticated ? (
              <LayoutDashboard className="w-4 h-4 text-[#28B110] group-hover:scale-110 transition-transform" />
            ) : (
              <Home className="w-4 h-4 text-[#28B110] group-hover:scale-110 transition-transform" />
            )}
            <span>{isAuthenticated ? 'Dashboard' : 'Início'}</span>
          </Link>

          <Link
            to="/repositories"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#161C15] border border-[#252E24] hover:border-[#28B110]/40 text-xs font-semibold text-[#D9EED6] transition-all group cursor-pointer"
          >
            <FolderGit2 className="w-4 h-4 text-[#889887] group-hover:text-[#28B110] transition-colors" />
            <span>Repositórios</span>
          </Link>

          <Link
            to="/issues"
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#161C15] border border-[#252E24] hover:border-[#28B110]/40 text-xs font-semibold text-[#D9EED6] transition-all group cursor-pointer"
          >
            <ListTodo className="w-4 h-4 text-[#889887] group-hover:text-[#28B110] transition-colors" />
            <span>Issues</span>
          </Link>
        </div>

        {/* Botão de Voltar */}
        <div className="pt-2 border-t border-[#1F261E]">
          <button
            onClick={() => navigate(-1)}
            type="button"
            className="inline-flex items-center gap-2 text-xs text-[#889887] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retornar à página anterior</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
