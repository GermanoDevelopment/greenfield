import React from 'react';
import { Link } from 'react-router-dom';
import CreateBountyForm from '../components/organisms/CreateBountyForm';
import { ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';

export const CreateBountyPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between border-b border-[#252E24] pb-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#889887] hover:text-[#D2DFD1] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Dashboard</span>
        </Link>

        <span className="text-xs font-mono font-semibold text-[#28B110] bg-[#182017] border border-[#252E24] px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#28B110]" /> Mantenedor Autorizado
        </span>
      </div>

      <div className="text-center max-w-xl mx-auto pt-2">
        <div className="inline-flex p-3 rounded-2xl bg-[#182017] border border-[#252E24] text-[#28B110] mb-3 shadow-sm">
          <Sparkles className="w-6 h-6 text-[#28B110]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Adicionar Issue ao Programa de Bounties
        </h1>
        <p className="text-xs sm:text-sm text-[#889887] mt-1.5">
          Aprove repositórios para a rodada de contribuição, selecione issues e receba propostas de desenvolvedores com garantia em USDC.
        </p>
      </div>

      <div className="rounded-2xl bg-[#182017] border border-[#252E24] shadow-card p-6 sm:p-8">
        <CreateBountyForm />
      </div>
    </div>
  );
};

export default CreateBountyPage;
