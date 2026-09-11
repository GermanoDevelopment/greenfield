import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletContextProvider } from './components/WalletContextProvider';
import { AppProvider } from './presentation/context/AppContext';
import AppLayout from './presentation/components/templates/AppLayout';

// Guardas de Rota
import ProtectedRoute from './presentation/components/guards/ProtectedRoute';
import RoleRoute from './presentation/components/guards/RoleRoute';

// Páginas do MVP Primário
import LandingPage from './presentation/pages/LandingPage';
import DashboardPage from './presentation/pages/DashboardPage';
import RepositoriesPage from './presentation/pages/RepositoriesPage';
import RepositoryIssuesPage from './presentation/pages/RepositoryIssuesPage';
import MyRewardsPage from './presentation/pages/MyRewardsPage';
import ProfilePage from './presentation/pages/ProfilePage';
import AdminPage from './presentation/pages/AdminPage';

// Páginas Complementares / Retrocompatibilidade
import CreateBountyPage from './presentation/pages/CreateBountyPage';
import BountyDetailsPage from './presentation/pages/BountyDetailsPage';
import MyContributionsPage from './presentation/pages/MyContributionsPage';
import ClaimPage from './presentation/pages/ClaimPage';
import PaymentHistoryPage from './presentation/pages/PaymentHistoryPage';
import SettingsPage from './presentation/pages/SettingsPage';

// Páginas de Erro Personalizadas
import NotFoundPage from './presentation/pages/NotFoundPage';
import ForbiddenPage from './presentation/pages/ForbiddenPage';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletContextProvider>
        <AppProvider>
          <Router>
            <AppLayout>
              <Routes>
                {/* 1. Rota Pública: Landing Page */}
                <Route path="/" element={<LandingPage />} />

                {/* 2. Rotas Protegidas por Autenticação (Qualquer usuário logado) */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/repositories"
                  element={
                    <ProtectedRoute>
                      <RepositoriesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/repositories/:id/issues"
                  element={
                    <ProtectedRoute>
                      <RepositoryIssuesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/issues"
                  element={
                    <ProtectedRoute>
                      <RepositoryIssuesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/rewards"
                  element={
                    <ProtectedRoute>
                      <MyRewardsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contributions"
                  element={
                    <ProtectedRoute>
                      <MyContributionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/claim"
                  element={
                    <ProtectedRoute>
                      <ClaimPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <PaymentHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bounties/:id"
                  element={
                    <ProtectedRoute>
                      <BountyDetailsPage />
                    </ProtectedRoute>
                  }
                />

                {/* 3. Rotas com Autorização RBAC Específica */}
                {/* Criação de Bounties: Apenas Mantenedores e Admins */}
                <Route
                  path="/bounties/new"
                  element={
                    <RoleRoute
                      allowedRoles={['MAINTAINER', 'maintainer', 'ADMIN', 'admin']}
                      resourceName="Criação de Bounties"
                    >
                      <CreateBountyPage />
                    </RoleRoute>
                  }
                />

                {/* Painel de Governança & Admin: Exclusivo ADMIN */}
                <Route
                  path="/admin"
                  element={
                    <RoleRoute
                      allowedRoles={['ADMIN', 'admin']}
                      resourceName="Painel Administrativo de Governança"
                    >
                      <AdminPage />
                    </RoleRoute>
                  }
                />

                {/* 4. Páginas de Erro Personalizadas */}
                <Route path="/403" element={<ForbiddenPage />} />
                <Route path="/404" element={<NotFoundPage />} />

                {/* 5. Fallback para rotas inexistentes */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AppLayout>
          </Router>
        </AppProvider>
      </WalletContextProvider>
    </QueryClientProvider>
  );
}

export default App;
