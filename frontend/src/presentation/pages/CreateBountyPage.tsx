import React from 'react';
import { Link } from 'react-router-dom';
import CreateBountyForm from '../components/organisms/CreateBountyForm';
import { ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';

export const CreateBountyPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Dashboard</span>
        </Link>

        <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Mantenedor Autorizado
        </span>
      </div>

      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Criar Nova Bounty
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Vincule uma Issue aberta do seu repositório a uma recompensa financeira garantida em USDC.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl">
        <CreateBountyForm />
      </div>
    </div>
  );
};

export default CreateBountyPage;
