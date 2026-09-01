import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletContextProvider } from './components/WalletContextProvider';
import { GitPullRequest, DollarSign, ShieldCheck } from 'lucide-react';

const queryClient = new QueryClient();

function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🌱</span>
          <span className="text-xl font-bold tracking-tight text-white">Greenfield</span>
        </div>
        <div className="flex items-center space-x-4">
          <a
            href="https://github.com/GermanoDevelopment/greenfield"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors"
            title="GitHub Repository"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
          <WalletMultiButton className="!bg-emerald-600 hover:!bg-emerald-700 !rounded-lg !h-10 !px-4 !text-sm" />
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 flex-1 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium mb-6">
          <ShieldCheck className="w-4 h-4" /> Solana Devnet MVP
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl">
          Transforme contribuições open source em <span className="text-emerald-400">recompensas instantâneas</span>
        </h1>
        
        <p className="mt-4 text-lg text-slate-400 max-w-xl">
          Crie bounties para issues no GitHub, valide pull requests e liquide pagamentos em USDC automaticamente com Solana smart contracts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl w-full text-left">
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
            <GitPullRequest className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold text-white">1. Vincule a Issue</h3>
            <p className="text-sm text-slate-400 mt-1">Conecte seu repositório GitHub e defina o valor do bounty em USDC.</p>
          </div>
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
            <DollarSign className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold text-white">2. Deposite em Escrow</h3>
            <p className="text-sm text-slate-400 mt-1">Os fundos ficam seguros no contrato inteligente na rede Solana.</p>
          </div>
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mb-3" />
            <h3 className="text-lg font-semibold text-white">3. Merge & Payout</h3>
            <p className="text-sm text-slate-400 mt-1">Quando o PR é mergeado, o desenvolvedor recebe o pagamento instantaneamente.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 px-6 py-6 text-center text-sm text-slate-500">
        Greenfield &copy; {new Date().getFullYear()} - GermanoDevelopment
      </footer>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletContextProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </Router>
      </WalletContextProvider>
    </QueryClientProvider>
  );
}

export default App;
