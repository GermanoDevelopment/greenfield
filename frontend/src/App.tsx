import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletContextProvider } from './components/WalletContextProvider';
import { AppProvider } from './presentation/context/AppContext';
import AppLayout from './presentation/components/templates/AppLayout';

// Páginas do MVP (Seção 7.1)
import LandingPage from './presentation/pages/LandingPage';
import DashboardPage from './presentation/pages/DashboardPage';
import CreateBountyPage from './presentation/pages/CreateBountyPage';
import BountyDetailsPage from './presentation/pages/BountyDetailsPage';
import MyContributionsPage from './presentation/pages/MyContributionsPage';
import ClaimPage from './presentation/pages/ClaimPage';
import PaymentHistoryPage from './presentation/pages/PaymentHistoryPage';
import SettingsPage from './presentation/pages/SettingsPage';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletContextProvider>
        <AppProvider>
          <Router>
            <AppLayout>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/bounties/new" element={<CreateBountyPage />} />
                <Route path="/bounties/:id" element={<BountyDetailsPage />} />
                <Route path="/contributions" element={<MyContributionsPage />} />
                <Route path="/claim" element={<ClaimPage />} />
                <Route path="/history" element={<PaymentHistoryPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </Router>
        </AppProvider>
      </WalletContextProvider>
    </QueryClientProvider>
  );
}

export default App;
