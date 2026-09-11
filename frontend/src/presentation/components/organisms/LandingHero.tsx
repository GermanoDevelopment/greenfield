import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GitPullRequest, Sparkles, Zap } from 'lucide-react';
import DesygenButton from '../atoms/DesygenButton';
import { useApp } from '../../context/AppContext';

export const LandingHero: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, openLoginModal } = useApp();

  const handleEnterAsMaintainer = () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    navigate('/bounties/new');
  };

  const handleEnterAsDeveloper = () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    navigate('/dashboard');
  };

  return (
    <section className="relative flex flex-col items-center justify-center text-center gap-8 pt-8 pb-4 w-full">
      {/* Background glow sutil */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[280px] bg-[#28B110]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Badge de Destaque */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#182017] text-[#28B110] border border-[#28B110]/30 text-xs font-semibold shadow-xs">
        <Zap className="w-3.5 h-3.5 text-[#28B110]" />
        <span>Bounties Open-Source com liquidação instantânea na Solana</span>
      </div>

      {/* Headline principal */}
      <div className="max-w-3xl mx-auto flex flex-col items-center gap-4">
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
          Contribuição no GitHub.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#28B110] via-emerald-400 to-[#9BEB8F]">
            USDC na Solana.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-[#889887] max-w-xl mx-auto leading-relaxed">
          Transforme Pull Requests aprovados em recompensas financeiras diretas na sua carteira.
          Sem custódia, 100% on-chain.
        </p>
      </div>

      {/* CTAs diretos */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
        <DesygenButton
          variant="primary"
          size="lg"
          onClick={handleEnterAsMaintainer}
          icon={<GitPullRequest className="w-4 h-4" />}
          className="w-full sm:w-auto !py-3.5 !px-8 text-sm font-bold shadow-md shadow-[#28B110]/20 transition-all cursor-pointer min-h-[48px]"
        >
          Entrar como Mantenedor
        </DesygenButton>

        <DesygenButton
          variant="secondary"
          size="lg"
          onClick={handleEnterAsDeveloper}
          icon={<Sparkles className="w-4 h-4 text-[#28B110]" />}
          className="w-full sm:w-auto !py-3.5 !px-8 text-sm font-bold transition-all cursor-pointer min-h-[48px] border-[#252E24] bg-[#182017] text-[#D2DFD1] hover:bg-[#20291e]"
        >
          Entrar como Desenvolvedor
        </DesygenButton>
      </div>
    </section>
  );
};

export default LandingHero;
