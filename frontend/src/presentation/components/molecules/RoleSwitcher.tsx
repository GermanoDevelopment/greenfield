import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Code2, Check, UserCheck } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { currentUser, setCurrentUser, availableUsers } = useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCleanName = (username: string) =>
    username
      .replace('-maintainer', ' (M)')
      .replace('-dev', '')
      .replace('-builder', '')
      .replace('-sol', '');

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Visualização Desktop (Segmented Control com Avatares) */}
      <div className="hidden sm:flex items-center gap-1 bg-[#182017] border border-[#283426] rounded-xl p-1 text-xs shadow-xs">
        <div className="hidden xl:flex items-center gap-1 px-1.5 text-[#889887] font-medium select-none">
          <UserCheck className="w-3.5 h-3.5 text-[#28B110]" />
          <span>Perfil:</span>
        </div>

        <div className="flex items-center gap-1">
          {availableUsers.map((u) => {
            const isActive = u.id === currentUser.id;

            return (
              <button
                key={u.id}
                onClick={() => setCurrentUser(u)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#253223] text-[#28B110] font-bold shadow-xs border border-[#28B110]/40'
                    : 'text-[#889887] hover:text-white hover:bg-[#1E281C]'
                }`}
                title={`Alternar para @${u.github_username} (${u.role === 'maintainer' ? 'Mantenedor' : 'Desenvolvedor'})`}
                type="button"
              >
                <img
                  src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                  alt={u.github_username}
                  className={`w-4 h-4 rounded-full object-cover border ${
                    isActive ? 'border-[#28B110]' : 'border-[#283426]'
                  }`}
                />
                <span>{getCleanName(u.github_username)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Visualização Mobile/Compacta (Dropdown) */}
      <div className="sm:hidden">
        <button
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#182017] border border-[#283426] text-xs font-semibold text-[#28B110]"
          type="button"
        >
          <img
            src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
            alt={currentUser.github_username}
            className="w-5 h-5 rounded-full object-cover border border-[#28B110]"
          />
          <span className="font-mono">{getCleanName(currentUser.github_username)}</span>
          <svg className={`w-3.5 h-3.5 text-[#889887] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#141C14] border border-[#283426] shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 border-b border-[#283426]/70 text-[11px] font-semibold text-[#889887]">
              Alternar Perfil Demo
            </div>
            {availableUsers.map((u) => {
              const isActive = u.id === currentUser.id;
              const isMaintainer = u.role === 'maintainer';

              return (
                <button
                  key={u.id}
                  onClick={() => {
                    setCurrentUser(u);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                    isActive ? 'bg-[#1D271C] text-[#28B110] font-bold' : 'text-[#D2DFD1] hover:bg-[#182017]'
                  }`}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={u.avatar_url}
                      alt={u.github_username}
                      className="w-5 h-5 rounded-full object-cover border border-[#283426]"
                    />
                    <div className="flex flex-col">
                      <span>@{u.github_username}</span>
                      <span className="text-[10px] text-[#889887] font-normal flex items-center gap-1">
                        {isMaintainer ? <Shield className="w-2.5 h-2.5 text-[#28B110]" /> : <Code2 className="w-2.5 h-2.5 text-[#28B110]" />}
                        {isMaintainer ? 'Mantenedor' : 'Dev'}
                      </span>
                    </div>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-[#28B110]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleSwitcher;
