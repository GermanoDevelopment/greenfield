import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Code2, CheckCircle2, GitPullRequest, DollarSign } from 'lucide-react';
import DesygenButton from '../atoms/DesygenButton';
import { useApp } from '../../context/AppContext';

export const DualRoleCard: React.FC = () => {
  const { isAuthenticated, openLoginModal } = useApp();

  const handleActionClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      openLoginModal();
    }
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Coluna 1: Para o Mantenedor */}
      <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 p-8 shadow-xl flex flex-col justify-between overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-mono uppercase px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Mantenedor
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              Acelere a Resolução de Issues
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Incentive contribuidores a resolverem gargalos críticos do seu projeto sem se preocupar
              com burocracia contábil de grants.
            </p>
          </div>

          <div className="flex flex-col gap-3 py-2">
            {[
              'Conecte seus repositórios autorizados via GitHub OAuth',
              'Selecione uma Issue existente e defina a recompensa em pontos',
              'Validação automática de saldo no Tesouro Comunitário ($25k)',
              'Atribua o dev e congele a recompensa (Invariante 2)',
              'Liberação exclusivamente condicionada ao seu Merge (Invariante 1)',
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-mono">
            Modo: Mantenedor de Projetos
          </div>

          <Link to="/bounties/new" onClick={handleActionClick}>
            <DesygenButton variant="primary" size="md" icon={<GitPullRequest className="w-4 h-4" />}>
              Criar Bounty como Mantenedor
            </DesygenButton>
          </Link>
        </div>
      </div>

      {/* Coluna 2: Para o Desenvolvedor */}
      <div className="relative rounded-3xl bg-slate-900/90 border border-slate-800 p-8 shadow-xl flex flex-col justify-between overflow-hidden group hover:border-sky-500/40 transition-all">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl group-hover:bg-sky-500/20 transition-all pointer-events-none" />

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Code2 className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-mono uppercase px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Desenvolvedor
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">
              Monetize Suas Contribuições
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Contribua para projetos de alto impacto no ecossistema Solana e receba em USDC direto
              na sua carteira logo após o merge.
            </p>
          </div>

          <div className="flex flex-col gap-3 py-2">
            {[
              'Encontre issues financiadas diretamente no fluxo do GitHub',
              'Desenvolva a solução e submeta seu Pull Request',
              'Valor de recompensa imutável garantido on-chain',
              'Receba notificação instantânea quando o PR for mergeado',
              'Faça o Claim direto para sua wallet Solana (Phantom/Solflare)',
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-mono">
            Modo: Contribuidor Open-Source
          </div>

          <Link to="/claim" onClick={handleActionClick}>
            <DesygenButton variant="secondary" size="md" icon={<DollarSign className="w-4 h-4" />}>
              Acessar Painel de Claim
            </DesygenButton>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DualRoleCard;
