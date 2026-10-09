import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { greenfieldApi } from '../../services/api';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useApp();

  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(`Erro reportado pelo GitHub OAuth: ${error}`);
      return;
    }

    if (!token) {
      setStatus('error');
      setErrorMessage('Nenhum token ou código de autorização foi recebido da resposta de autenticação.');
      return;
    }

    const processLogin = async () => {
      try {
        await loginWithToken(token);
        setStatus('success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 600);
      } catch (err: unknown) {
        setStatus('error');
        const detail =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          (err as { message?: string })?.message ||
          'Falha ao carregar seu perfil com o token fornecido.';
        setErrorMessage(detail);
      }
    };

    processLogin();
  }, [searchParams, loginWithToken, navigate]);

  const handleRetry = () => {
    window.location.href = greenfieldApi.getGithubLoginUrl();
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121712] border border-[#252E24] rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-6">
        {status === 'processing' && (
          <div className="space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1B261A] border border-[#28B110]/40 flex items-center justify-center text-[#28B110]">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Autenticando com GitHub</h1>
              <p className="text-xs text-[#889887] mt-1">
                Validando suas credenciais e carregando seu perfil...
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#182618] border border-[#28B110]/60 flex items-center justify-center text-[#28B110]">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Login Concluído!</h1>
              <p className="text-xs text-[#889887] mt-1">
                Redirecionando para o seu dashboard...
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Falha na Autenticação</h1>
              <div className="mt-2.5 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 text-left">
                {errorMessage}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleRetry}
                className="w-full py-2.5 rounded-xl bg-[#28B110] hover:bg-[#22950d] text-white font-bold text-xs shadow-md shadow-[#28B110]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>Tentar Novamente com GitHub</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full py-2.5 rounded-xl bg-[#161C15] hover:bg-[#1E271D] border border-[#252E24] text-[#889887] hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar à Página Inicial</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
