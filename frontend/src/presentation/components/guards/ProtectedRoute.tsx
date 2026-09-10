import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, authInitialized } = useApp();
  const location = useLocation();

  // Enquanto valida a sessão ou token no boot
  if (!authInitialized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#182017] border border-[#28B110]/30 flex items-center justify-center text-[#28B110]">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-mono text-[#889887] tracking-wider uppercase">
          Verificando autenticação...
        </p>
      </div>
    );
  }

  // Não autenticado: BLOQUEIA o acesso e redireciona IMEDIATAMENTE para a raiz abrindo o modal de login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          from: location.pathname,
          requireAuth: true,
        }}
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
