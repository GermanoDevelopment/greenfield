import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  User as UserIcon,
  LogIn,
  LogOut,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { currentUser, isAuthenticated, openLoginModal, logout } = useApp();
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

  if (!isAuthenticated) {
    return (
      <button
        onClick={openLoginModal}
        type="button"
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#28B110] hover:bg-[#22950d] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
        title="Fazer Login"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Entrar</span>
      </button>
    );
  }

  const roleUpper = (currentUser.role || '').toUpperCase();
  const isAdmin = roleUpper === 'ADMIN';
  const isMaintainer = roleUpper === 'MAINTAINER';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão de Perfil Ativo */}
      <button
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#182017] border border-[#283426] hover:border-[#28B110]/50 text-xs text-[#D9EED6] transition-all cursor-pointer"
        type="button"
      >
        <img
          src={
            currentUser.avatar_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              currentUser.name || currentUser.github_username
            )}&background=28B110&color=fff`
          }
          alt={currentUser.name || currentUser.github_username}
          className="w-5 h-5 rounded-full object-cover border border-[#28B110]/60"
        />
        <span className="font-medium max-w-[100px] truncate">
          {currentUser.name || currentUser.github_username}
        </span>
        <span
          className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
            isAdmin
              ? 'bg-purple-900/60 text-purple-300 border border-purple-500/40 font-bold'
              : isMaintainer
              ? 'bg-[#192A17] text-[#28B110] border border-[#28B110]/40'
              : 'bg-[#1A2319] text-[#889887] border border-[#252E24]'
          }`}
        >
          {currentUser.role}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#889887] transition-transform ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Menu Dropdown de Usuário */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#141C14] border border-[#283426] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
          {/* Header do Usuário */}
          <div className="px-3.5 py-2 border-b border-[#283426]/70">
            <div className="text-xs font-bold text-white truncate">
              {currentUser.name || currentUser.github_username}
            </div>
            <div className="text-[10px] font-mono text-[#889887] truncate">
              {currentUser.email || `@${currentUser.github_username}`}
            </div>
          </div>

          {/* Links Rápidos */}
          <div className="px-1.5 py-1 space-y-0.5">
            <Link
              to="/profile"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#D9EED6] hover:bg-[#1C261B] hover:text-[#28B110] transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#889887]" />
              <span>Meu Perfil</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-purple-300 hover:bg-purple-950/40 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Painel Admin</span>
              </Link>
            )}

            <Link
              to="/"
              onClick={() => setIsDropdownOpen(false)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#889887] hover:bg-[#1C261B] hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Landing Page</span>
            </Link>
          </div>

          {/* Botão Sair */}
          <div className="px-1.5 pt-1 border-t border-[#283426]/70">
            <button
              type="button"
              onClick={() => {
                logout();
                setIsDropdownOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Encerrar Sessão</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleSwitcher;
