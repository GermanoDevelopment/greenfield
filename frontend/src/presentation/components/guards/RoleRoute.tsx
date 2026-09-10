import React from 'react';
import { Outlet } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ProtectedRoute } from './ProtectedRoute';
import { ForbiddenPage } from '../../pages/ForbiddenPage';

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
  const { isAuthenticated, currentUser, loading } = useApp();

  // Se ainda estiver validando o token no boot
  if (loading) {
    return <ProtectedRoute>{null}</ProtectedRoute>;
  }

  // Se o usuário sequer está autenticado, barra via ProtectedRoute
  if (!isAuthenticated) {
    return <ProtectedRoute>{null}</ProtectedRoute>;
  }

  // Validação de Autorização (RBAC)
  const currentRole = (currentUser.role || '').toUpperCase();
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
  const isAllowed = normalizedAllowed.includes(currentRole);

  if (!isAllowed) {
    return (
      <ForbiddenPage
        requiredRole={allowedRoles.join(' ou ')}
        resourceName={resourceName}
      />
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default RoleRoute;
