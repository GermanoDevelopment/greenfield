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
      {/* Barra de controle e boas-vindas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Dashboard Greenfield
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Conectado como <strong className="text-blue-600">@{currentUser.github_username}</strong>{' '}
            ({currentUser.role === 'maintainer' ? 'Mantenedor do Repositório' : 'Desenvolvedor Contribuidor'}).
          </p>
        </div>

        {/* Alternador de visão do dashboard */}
        <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 p-1 rounded-xl text-xs self-start sm:self-auto">
          <button
            onClick={() => setViewOverride('maintainer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeView === 'maintainer'
                ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Visão Mantenedor</span>
          </button>

          <button
            onClick={() => setViewOverride('developer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeView === 'developer'
                ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Visão Desenvolvedor</span>
          </button>
        </div>
      </div>

      {/* Renderização condicional */}
      {activeView === 'maintainer' ? <MaintainerDashboard /> : <DeveloperDashboard />}
    </div>
  );
};

export default DashboardPage;
