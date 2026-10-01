import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Loader2 } from 'lucide-react';

interface RoleRouteProps {
  allowedRoles: string[];
  resourceName?: string;
  children?: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({
  allowedRoles,
  resourceName,
  children,
}) => {
  const { isAuthenticated, currentUser, authInitialized } = useApp();
  const location = useLocation();

  // Se ainda estiver validando o token no boot
  if (!authInitialized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#182017] border border-[#28B110]/30 flex items-center justify-center text-[#28B110]">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-xs font-mono text-[#889887] tracking-wider uppercase">
          Verificando permissões...
        </p>
      </div>
    );
  }

  // Se não autenticado, redireciona imediatamente para a raiz
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

  // Validação de Autorização (RBAC)
  const currentRole = (currentUser.role || '').toUpperCase();
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
  const isAllowed = normalizedAllowed.includes(currentRole);

  if (!isAllowed) {
    return (
      <Navigate
        to="/403"
        replace
        state={{
          requiredRole: allowedRoles.join(' ou '),
          resourceName,
          from: location.pathname,
        }}
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RoleRoute;
