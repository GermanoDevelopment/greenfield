import React from 'react';
import LandingHero from '../components/organisms/LandingHero';
import MinimalStepsOverview from '../components/organisms/MinimalStepsOverview';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-14 py-8 max-w-4xl mx-auto w-full">
      {/* 1. Hero com Proposta Direta e CTAs */}
      <LandingHero />

      {/* 2. Como Funciona em 3 Passos */}
      <section className="w-full">
        <MinimalStepsOverview />
      </section>
    </div>
  );
};

export default LandingPage;
