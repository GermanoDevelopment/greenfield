import React from 'react';
import { Link } from 'react-router-dom';
import LandingHero from '../components/organisms/LandingHero';
import MinimalStepsOverview from '../components/organisms/MinimalStepsOverview';
import PointsCalculatorSection from '../components/organisms/PointsCalculatorSection';
import DesygenButton from '../components/atoms/DesygenButton';
import { ArrowRight, Sparkles } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-16 py-2 max-w-5xl mx-auto w-full">
      {/* 1. Hero com Logo Oficial, Banner de Marca e CTAs */}
      <LandingHero />

      {/* 2. O Ciclo em 3 Passos Essenciais (Issue -> Merge -> Claim) */}
      <section className="w-full">
        <MinimalStepsOverview />
      </section>

      {/* 3. Conversor de Pontos & Regra Contábil (100 pts = $1 USDC) */}
      <section className="w-full">
        <PointsCalculatorSection />
      </section>

      {/* 4. Chamada para Ação Final Limpa */}
      <section className="w-full p-8 sm:p-10 rounded-3xl bg-[#1B1E1A] border-2 border-[#145907] hover:border-[#28B110]/40 shadow-2xl text-center flex flex-col items-center gap-5 transition-all">
        <div className="w-12 h-12 rounded-2xl bg-[#145907]/50 border border-[#28B110]/40 text-[#28B110] flex items-center justify-center font-bold shadow-lg">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Pronto para Experimentar o Greenfield?
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Acesse o dashboard com dados de demonstração (Alice, Bob e Carol), crie novas recompensas ou resgate seus USDC na Solana Devnet.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 mt-1">
          <Link to="/dashboard">
            <DesygenButton
              variant="primary"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              className="!py-3.5 !px-8 text-sm font-bold shadow-xl shadow-[#28B110]/20 hover:scale-105 transition-all !bg-[#28B110] hover:!bg-[#239e0e] text-white"
            >
              Acessar Plataforma MVP
            </DesygenButton>
          </Link>

          <Link to="/claim">
            <DesygenButton
              variant="secondary"
              size="lg"
              className="!py-3.5 !px-8 text-sm font-bold !border-[#28B110] !text-[#D9EED6]"
            >
              Testar Resgate de USDC
            </DesygenButton>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
