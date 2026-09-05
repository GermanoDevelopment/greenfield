import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, GitPullRequest, DollarSign, Sparkles, Coins } from 'lucide-react';
import DesygenButton from '../atoms/DesygenButton';
import BrandBanner from '../atoms/BrandBanner';
import { useApp } from '../../context/AppContext';

export const LandingHero: React.FC = () => {
  const navigate = useNavigate();
  const { setCurrentUser, availableUsers } = useApp();

  const handleEnterAsMaintainer = () => {
    const maintainer = availableUsers.find((u) => u.role === 'maintainer');
    if (maintainer) setCurrentUser(maintainer);
    navigate('/dashboard');
  };

  const handleEnterAsDeveloper = () => {
    const dev = availableUsers.find((u) => u.role === 'developer');
    if (dev) setCurrentUser(dev);
    navigate('/dashboard');
  };

  return (
    <section className="relative flex flex-col items-center justify-center text-center gap-8 pt-4 pb-8 overflow-hidden w-full">
      {/* Glow de fundo nas cores da marca */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#28B110]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Badges superiores com cores oficiais */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#145907]/40 text-[#D9EED6] border border-[#28B110]/40 text-xs font-mono font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#28B110]" /> Solana Devnet MVP
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#145907]/20 text-[#D9EED6] border border-[#145907] text-xs font-mono font-semibold">
          <Coins className="w-4 h-4 text-[#28B110]" /> Tesouro Comunitário: $25.000 USDC
        </div>
      </div>

      {/* Headline & Logo Principal */}
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-5">
        <div className="inline-flex items-center gap-3 p-2 px-4 rounded-2xl bg-[#1B1E1A] border border-[#145907] shadow-lg">
          <img src="/Icon-only.png" alt="Greenfield Logo" className="w-7 h-7 object-contain" />
          <span className="font-extrabold text-sm tracking-wider text-white uppercase font-mono">
            GREENFIELD ECOSYSTEM
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight">
          Contribuição no GitHub.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#28B110] via-[#D9EED6] to-[#28B110]">
            USDC na Solana.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Transforme contribuições open-source em recompensas financeiras pagas instantaneamente.
          O mantenedor aprova e mergeia; o desenvolvedor assina e resgata seu USDC on-chain.
        </p>
      </div>

      {/* Proposta Central: Issue -> PR -> Merge -> USDC */}
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-5 rounded-2xl bg-[#1B1E1A] border border-[#145907] shadow-2xl flex flex-wrap items-center justify-center gap-2 sm:gap-4 font-mono text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 text-slate-200 border border-[#145907]">
          <GitPullRequest className="w-3.5 h-3.5 text-[#28B110]" />
          <span>Issue Aberta</span>
        </div>

        <span className="text-[#28B110] font-bold">→</span>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 text-slate-200 border border-[#145907]">
          <span>Pull Request</span>
        </div>

        <span className="text-[#28B110] font-bold">→</span>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#145907]/40 text-[#D9EED6] border border-[#28B110]/40 font-bold">
          <span>Merge Efetivo</span>
        </div>

        <span className="text-[#28B110] font-bold">→</span>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#28B110]/20 text-white border border-[#28B110] font-bold shadow-sm shadow-[#28B110]/30">
          <DollarSign className="w-4 h-4 text-[#28B110]" />
          <span>USDC Instantâneo</span>
        </div>
      </div>

      {/* Ações CTAs Dual-Audience */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
        <DesygenButton
          variant="primary"
          size="lg"
          onClick={handleEnterAsMaintainer}
          icon={<GitPullRequest className="w-5 h-5" />}
          className="w-full sm:w-auto !py-4 !px-8 text-sm sm:text-base font-bold shadow-xl shadow-[#28B110]/20 hover:scale-105 transition-all cursor-pointer !bg-[#28B110] hover:!bg-[#239e0e] text-white"
        >
          Entrar como Mantenedor
        </DesygenButton>

        <DesygenButton
          variant="secondary"
          size="lg"
          onClick={handleEnterAsDeveloper}
          icon={<Sparkles className="w-5 h-5 text-[#28B110]" />}
          className="w-full sm:w-auto !py-4 !px-8 text-sm sm:text-base font-bold hover:bg-[#145907]/20 transition-all cursor-pointer !border-[#28B110] !text-[#D9EED6]"
        >
          Entrar como Desenvolvedor
        </DesygenButton>
      </div>

      {/* Componente de Banner Oficial (Icon-banner.png) */}
      <div className="w-full pt-6">
        <BrandBanner />
      </div>

      {/* Métricas Principais da Plataforma */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl w-full mx-auto pt-4 border-t border-[#145907]/60 text-left font-mono">
        <div className="p-3.5 rounded-2xl bg-[#1B1E1A] border border-[#145907]">
          <span className="text-[10px] text-slate-400 uppercase block font-sans">Tesouro Inicial</span>
          <span className="text-lg font-bold text-white">$25.000 USDC</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#1B1E1A] border border-[#145907]">
          <span className="text-[10px] text-slate-400 uppercase block font-sans">Regra Contábil</span>
          <span className="text-lg font-bold text-[#28B110]">100 pts = $1</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#1B1E1A] border border-[#145907]">
          <span className="text-[10px] text-slate-400 uppercase block font-sans">Confirmação</span>
          <span className="text-lg font-bold text-[#D9EED6]">Solana Devnet</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#1B1E1A] border border-[#145907]">
          <span className="text-[10px] text-slate-400 uppercase block font-sans">Custódia Backend</span>
          <span className="text-lg font-bold text-[#28B110]">0% (On-Chain)</span>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
