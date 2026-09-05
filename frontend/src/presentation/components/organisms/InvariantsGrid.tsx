import React from 'react';
import { GitMerge, Lock, ShieldCheck, Landmark, Check } from 'lucide-react';

export const InvariantsGrid: React.FC = () => {
  const invariants = [
    {
      id: '01',
      title: 'Invariante 1 — Merge Obrigatório',
      equation: 'PR aberto ≠ Recompensa liberada',
      corollary: 'PR merged = Condição Necessária',
      description:
        'A atividade de desenvolvimento por si só não gera pagamento. Somente a incorporação efetiva do código à branch autorizada aciona a transição para CLAIMABLE.',
      icon: <GitMerge className="w-5 h-5 text-emerald-400" />,
      tagColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30',
    },
    {
      id: '02',
      title: 'Invariante 2 — Valor Imutável',
      equation: 'valor_inicial == valor_final',
      corollary: 'Pós-atribuição: Redução proibida',
      description:
        'Depois que a bounty é atribuída ou aceita pelo desenvolvedor, a recompensa é congelada no protocolo. O mantenedor não pode reduzir o montante acordado.',
      icon: <Lock className="w-5 h-5 text-sky-400" />,
      tagColor: 'text-sky-400 bg-sky-950/60 border-sky-500/30',
    },
    {
      id: '03',
      title: 'Invariante 3 — Prevenção de Double-Claim',
      equation: 'claimed == false',
      corollary: 'Sucesso: claimed = true permanente',
      description:
        'Garantida criptograficamente no smart contract Solana. Uma vez que o USDC é transferido e a assinatura é registrada, tentativas repetidas de resgate são rejeitadas.',
      icon: <ShieldCheck className="w-5 h-5 text-purple-400" />,
      tagColor: 'text-purple-400 bg-purple-950/60 border-purple-500/30',
    },
    {
      id: '04',
      title: 'Invariante 4 — Tesouro Solvente',
      equation: 'saldo_disponivel >= valor_bounty',
      corollary: 'Pool Comunitário: $25.000 USDC',
      description:
        'É impossível publicar uma bounty sem liquidez prévia. O sistema valida e reserva os fundos em Escrow antes de disponibilizar a tarefa para desenvolvimento.',
      icon: <Landmark className="w-5 h-5 text-amber-400" />,
      tagColor: 'text-amber-400 bg-amber-950/60 border-amber-500/30',
    },
  ];

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
          Segurança Criptográfica & Regras de Negócio
        </span>
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
          As 4 Invariantes do Protocolo
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          As regras do GREENFIELD não são simples convenções de interface; são invariantes de sistema
          enforçadas pela máquina de estados e pelo smart contract.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {invariants.map((inv) => (
          <div
            key={inv.id}
            className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between gap-4 group"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                  {inv.icon}
                </div>
                <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border font-bold ${inv.tagColor}`}>
                  {inv.corollary}
                </span>
              </div>

              <div>
                <h4 className="text-lg font-bold text-white tracking-tight">
                  {inv.title}
                </h4>
                <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-emerald-300">
                  <code>{inv.equation}</code>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-1">
                {inv.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-850 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verificado automaticamente pela camada de domínio</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InvariantsGrid;
