import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserCheck, Shield, Code2 } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { currentUser, setCurrentUser, availableUsers } = useApp();

  return (
    <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
      <div className="hidden lg:flex items-center gap-1 px-1.5 text-slate-500 font-medium">
        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
        <span>Perfil:</span>
      </div>

      <div className="flex items-center gap-1">
        {availableUsers.map((u) => {
          const isActive = u.id === currentUser.id;
          const isMaintainer = u.role === 'maintainer';

          return (
            <button
              key={u.id}
              onClick={() => setCurrentUser(u)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
              title={`Alternar para ${u.github_username} (${u.role})`}
            >
              {isMaintainer ? (
                <Shield className="w-3 h-3 text-blue-600" />
              ) : (
                <Code2 className="w-3 h-3 text-emerald-600" />
              )}
              <span>
                {u.github_username.replace('-maintainer', ' (M)').replace('-dev', '').replace('-builder', '').replace('-sol', '')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSwitcher;
