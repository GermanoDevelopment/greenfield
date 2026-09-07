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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#252E24] pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Dashboard Greenfield
          </h1>
          <p className="text-xs text-[#889887] mt-1">
            Conectado como <strong className="text-[#28B110]">@{currentUser.github_username}</strong>{' '}
            ({currentUser.role === 'maintainer' ? 'Mantenedor do Repositório' : 'Desenvolvedor Contribuidor'}).
          </p>
        </div>

        {/* Alternador de visão do dashboard */}
        <div className="flex items-center gap-1.5 bg-[#182017] border border-[#252E24] p-1 rounded-xl text-xs self-start sm:self-auto">
          <button
            onClick={() => setViewOverride('maintainer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeView === 'maintainer'
                ? 'bg-[#253223] text-[#D2DFD1] font-bold shadow-sm border border-[#28B110]/40'
                : 'text-[#889887] hover:text-[#D2DFD1]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#28B110]" />
            <span>Visão Mantenedor</span>
          </button>

          <button
            onClick={() => setViewOverride('developer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeView === 'developer'
                ? 'bg-[#253223] text-[#D2DFD1] font-bold shadow-sm border border-[#28B110]/40'
                : 'text-[#889887] hover:text-[#D2DFD1]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
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
