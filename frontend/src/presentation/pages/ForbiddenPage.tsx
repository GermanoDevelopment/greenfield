import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  ShieldAlert,
  LayoutDashboard,
  User,
  KeyRound,
  ArrowLeft,
  Lock,
} from 'lucide-react';

interface ForbiddenPageProps {
  requiredRole?: string;
  resourceName?: string;
}

export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({
  requiredRole = 'ADMIN',
  resourceName,
}) => {
  const { currentUser, isAuthenticated, openLoginModal } = useApp();

  const currentRole = (currentUser.role || 'CONTRIBUTOR').toUpperCase();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-[#121712] border border-[#2B2320] rounded-3xl p-6 sm:p-10 text-center shadow-2xl space-y-6 relative overflow-hidden">
        {/* Glow de alerta vermelho / âmbar */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Badge 403 */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/40 text-rose-400 border border-rose-500/30 text-xs font-mono font-bold tracking-wider">
          <Lock className="w-3.5 h-3.5 text-rose-400" />
          <span>HTTP 403: FORBIDDEN</span>
        </div>

        {/* Ícone de Escudo em Alerta */}
        <div className="w-16 h-16 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/50">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Textos Principais */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Acesso Restrito
          </h1>
          <p className="text-xs sm:text-sm text-[#988887] max-w-md mx-auto leading-relaxed">
            {resourceName
              ? `O recurso "${resourceName}" requer privilégios especiais de governança.`
              : 'Você não tem permissão para acessar esta área restrita da governança Greenfield.'}
          </p>
        </div>

        {/* Detalhes do Usuário e Permissões */}
        <div className="bg-[#181514] border border-[#2D2220] rounded-2xl p-4 text-left space-y-2.5">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#2D2220]">
            <span className="text-[#888]">Usuário Conectado:</span>
            <span className="font-semibold text-white">
              {currentUser.name || currentUser.github_username}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#2D2220]">
            <span className="text-[#888]">E-mail:</span>
            <span className="font-mono text-[#D9EED6]">
              {currentUser.email || 'Não cadastrado'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#2D2220]">
            <span className="text-[#888]">Papel Atual:</span>
            <span className="font-mono px-2 py-0.5 rounded text-[11px] bg-[#221B19] text-[#E07A5F] border border-[#E07A5F]/30 uppercase font-bold">
              {currentRole}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#888]">Papel Mínimo Exigido:</span>
            <span className="font-mono px-2 py-0.5 rounded text-[11px] bg-purple-950/50 text-purple-300 border border-purple-500/40 uppercase font-bold">
              {requiredRole.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={openLoginModal}
            type="button"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#28B110] to-emerald-500 hover:from-[#22950d] hover:to-emerald-600 text-white text-xs font-bold shadow-md shadow-[#28B110]/20 transition-all cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>
              {isAuthenticated
                ? 'Trocar para Conta Admin (1-Click)'
                : 'Conectar com Conta Admin'}
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/dashboard"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#161C15] hover:bg-[#1D271B] border border-[#252E24] text-xs text-[#D9EED6] transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#28B110]" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/profile"
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#161C15] hover:bg-[#1D271B] border border-[#252E24] text-xs text-[#889887] hover:text-white transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>Meu Perfil</span>
            </Link>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#6B7C6A] hover:text-[#28B110] transition-colors pt-2"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Voltar para a Landing Page</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
