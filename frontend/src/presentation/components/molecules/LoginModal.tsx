import React, { useState, useEffect } from 'react';
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
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface LoginModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
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
        setSuccessMessage('Autenticado com sucesso!');
      } else {
        await register(email, password, username || undefined);
        setSuccessMessage('Conta criada e autenticada com sucesso!');
      }

      setTimeout(() => {
        handleClose();
      }, 600);
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
                Autenticação com e-mail e senha
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
                placeholder="seu.email@greenfield.com"
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

          {mode === 'register' && (
            <p className="text-[11px] text-[#889887] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#28B110] shrink-0" />
              E-mails com domínio @greenfield.com recebem papel ADMIN.
            </p>
          )}

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
