import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserCheck, Shield, Code2 } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { currentUser, setCurrentUser, availableUsers } = useApp();

  return (
    <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
      <div className="hidden sm:flex items-center gap-1 px-2 text-slate-400 font-medium">
        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
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
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={`Alternar para ${u.github_username} (${u.role})`}
            >
              {isMaintainer ? (
                <Shield className="w-3 h-3" />
              ) : (
                <Code2 className="w-3 h-3" />
              )}
              <span>{u.github_username.replace('-maintainer', ' (M)').replace('-dev', '').replace('-builder', '').replace('-sol', '')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoleSwitcher;
