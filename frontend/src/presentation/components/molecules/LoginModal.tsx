import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { greenfieldApi } from '../../../services/api';

interface LoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const navigate = useNavigate();
  const { isLoginModalOpen, closeLoginModal, login, register } = useApp();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isLoginModalOpen;
  const handleClose = propOnClose || closeLoginModal;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  // Fecha com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Por favor, informe e-mail e senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (mode === 'login') {
        await login(email, password);
        setSuccessMessage('Autenticado com sucesso! Redirecionando...');
      } else {
        await register(email, password, username || undefined);
        setSuccessMessage('Conta criada e autenticada com sucesso! Redirecionando...');
      }

      setTimeout(() => {
        handleClose();
        navigate('/dashboard');
      }, 400);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Erro ao processar autenticação. Verifique suas credenciais.';
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = () => {
    window.location.href = greenfieldApi.getGithubLoginUrl();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md bg-[#121712] border border-[#252E24] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com Botão Fechar */}
        <div className="flex items-center justify-between border-b border-[#202720] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1B261A] border border-[#28B110]/40 flex items-center justify-center text-[#28B110]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                {mode === 'login' ? 'Acessar Greenfield' : 'Criar Conta'}
              </h2>
              <p className="text-[11px] text-[#889887]">
                Acesse via GitHub ou com e-mail e senha
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-[#889887] hover:text-white p-1 rounded-lg hover:bg-[#1A2319] transition-colors cursor-pointer"
            title="Fechar"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-[#182618] border border-[#28B110]/50 text-xs text-[#D9EED6] flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#28B110] shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Botão GitHub OAuth */}
        <button
          type="button"
          onClick={handleGithubLogin}
          className="w-full py-2.5 px-4 rounded-xl bg-[#171E16] hover:bg-[#1E281D] border border-[#2B3B2A] hover:border-[#28B110]/60 text-white font-semibold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm group"
        >
          <svg className="w-4 h-4 fill-currentColor text-white group-hover:text-[#28B110] transition-colors shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
          <span>Entrar com GitHub</span>
        </button>

        {/* Divisor */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#202720]" />
          <span className="text-[10px] text-[#687867] uppercase tracking-wider font-mono">ou com e-mail</span>
          <div className="flex-1 h-px bg-[#202720]" />
        </div>

        {/* Abas Alternadoras */}
        <div className="flex rounded-xl bg-[#161C15] border border-[#252E24] p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-[#253223] text-[#28B110] font-bold shadow-xs'
                : 'text-[#889887] hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-[#253223] text-[#28B110] font-bold shadow-xs'
                : 'text-[#889887] hover:text-white'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="text-xs text-[#9EAE9D] font-medium block">
                Nome ou Username (Opcional)
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#889887] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ex: Germano"
                  className="w-full bg-[#161C15] border border-[#252E24] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#556354] focus:outline-none focus:border-[#28B110] transition-colors"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-[#9EAE9D] font-medium block">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#889887] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full bg-[#161C15] border border-[#252E24] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-[#556354] focus:outline-none focus:border-[#28B110] transition-colors font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#9EAE9D] font-medium">Senha</label>
              <span className="text-[10px] text-[#687867]">mínimo 6 caracteres</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#889887] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#161C15] border border-[#252E24] rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-[#556354] focus:outline-none focus:border-[#28B110] transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#889887] hover:text-white cursor-pointer"
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-[#28B110] hover:bg-[#22950d] text-white font-bold text-xs shadow-md shadow-[#28B110]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processando...</span>
              </>
            ) : mode === 'login' ? (
              'Entrar na Plataforma'
            ) : (
              'Criar Minha Conta'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;
