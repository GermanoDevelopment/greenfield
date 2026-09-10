import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Lock, LogIn, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, openLoginModal } = useApp();

  // Enquanto valida a sessão ou dados iniciais no boot
  if (loading) {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#182017] border border-[#28B110]/30 flex items-center justify-center text-[#28B110]">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-mono text-[#889887] tracking-wider uppercase">
          Verificando credenciais on-chain...
        </p>
      </div>
    );
  }

  // Se não autenticado, bloqueia o acesso e exibe a barreira de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#121712] border border-[#252E24] rounded-2xl p-6 sm:p-8 text-center shadow-xl space-y-6 relative overflow-hidden">
          {/* Background glow sutil */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#28B110]/10 rounded-full blur-2xl pointer-events-none" />

          {/* Ícone de bloqueio */}
          <div className="w-14 h-14 rounded-2xl bg-[#192618] border border-[#28B110]/40 text-[#28B110] flex items-center justify-center mx-auto shadow-md shadow-[#28B110]/10">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#687867] px-2.5 py-0.5 rounded-full bg-[#161C15] border border-[#252E24]">
              401 — Não Autenticado
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Autenticação Obrigatória
            </h2>
            <p className="text-xs text-[#889887] leading-relaxed">
              Esta área requer que você esteja autenticado na plataforma Greenfield. Conecte-se com sua conta para prosseguir.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={openLoginModal}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#28B110] hover:bg-[#22950d] text-white text-xs font-bold shadow-md shadow-[#28B110]/20 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Fazer Login</span>
            </button>

            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#161C15] hover:bg-[#1D251D] border border-[#252E24] text-xs text-[#889887] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Início</span>
            </Link>
          </div>

          <div className="pt-2 border-t border-[#1E251E] flex items-center justify-center gap-1.5 text-[11px] text-[#6B7C6A]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#28B110]" />
            <span>Acesso rápido disponível para administradores</span>
          </div>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
