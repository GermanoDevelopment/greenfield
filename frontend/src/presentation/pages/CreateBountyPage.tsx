import React from 'react';
import { Link } from 'react-router-dom';
import CreateBountyForm from '../components/organisms/CreateBountyForm';
import { ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';

export const CreateBountyPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Dashboard</span>
        </Link>

        <span className="text-xs font-mono font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" /> Mantenedor Autorizado
        </span>
      </div>

      <div className="text-center max-w-xl mx-auto pt-2">
        <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-sm">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Criar Nova Recompensa (Bounty)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
          Wizard guiado em 3 etapas para vincular uma issue a uma garantia em USDC na Solana.
        </p>
      </div>

      <div className="rounded-2xl bg-white border border-[#EEF2F6] shadow-card p-6 sm:p-8">
        <CreateBountyForm />
      </div>
    </div>
  );
};

export default CreateBountyPage;
