import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import MaintainerDashboard from '../components/organisms/MaintainerDashboard';
import DeveloperDashboard from '../components/organisms/DeveloperDashboard';
import { Shield, Code2 } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useApp();
  const [viewOverride, setViewOverride] = useState<'maintainer' | 'developer' | null>(null);

  const activeView = viewOverride || (currentUser.role === 'maintainer' ? 'maintainer' : 'developer');

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de controle de visualização */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Dashboard Greenfield
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Conectado como <strong className="text-emerald-400">@{currentUser.github_username}</strong>{' '}
            ({currentUser.role === 'maintainer' ? 'Mantenedor do Repositório' : 'Desenvolvedor Contribuidor'}).
          </p>
        </div>

        {/* Alternador manual de visão do dashboard */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setViewOverride('maintainer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeView === 'maintainer'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Visão Mantenedor</span>
          </button>

          <button
            onClick={() => setViewOverride('developer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeView === 'developer'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Visão Desenvolvedor</span>
          </button>
        </div>
      </div>

      {/* Renderização condicional do dashboard correspondente */}
      {activeView === 'maintainer' ? <MaintainerDashboard /> : <DeveloperDashboard />}
    </div>
  );
};

export default DashboardPage;
