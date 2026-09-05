import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ClaimModal from '../components/organisms/ClaimModal';
import PointsBadge from '../components/atoms/PointsBadge';
import UsdcBadge from '../components/atoms/UsdcBadge';
import SolanaAddressPill from '../components/atoms/SolanaAddressPill';
import { Sparkles, Coins } from 'lucide-react';
import type { Bounty } from '../../core/domain/types';

export const ClaimPage: React.FC = () => {
  const { bounties, currentUser, setCurrentUser, availableUsers } = useApp();
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);

  // Busca todas as bounties em estado CLAIMABLE
  const claimableList = bounties.filter((b) => b.status === 'CLAIMABLE');
  const myClaimableList = claimableList.filter((b) => b.developer_id === currentUser.id);

  const carolUser = availableUsers.find((u) => u.github_username === 'carol-sol');

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3 animate-pulse">
          <Sparkles className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Central de Resgate USDC
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Assine a transação na sua carteira Solana para liquidar instantaneamente os USDC das contribuições aprovadas.
        </p>
      </div>

      {/* Carteira Conectada */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 block font-mono uppercase">Carteira de Recebimento</span>
          <span className="text-sm font-semibold text-white">@{currentUser.github_username}</span>
        </div>
        <div className="flex items-center gap-2">
          <SolanaAddressPill address={currentUser.wallet_address} />
          <span className="text-xs px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700 font-mono">
            Devnet
          </span>
        </div>
      </div>

      {/* Lista de Bounties Prontas para Claim */}
      {myClaimableList.length > 0 ? (
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wider">
            Recompensas Prontas para Saque ({myClaimableList.length})
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {myClaimableList.map((bounty) => (
              <div
                key={bounty.id}
                className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-950/30 border-2 border-emerald-500/60 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6"
              >
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <span>{bounty.repository?.owner}/{bounty.repository?.name}</span>
                    <span>•</span>
                    <span>Issue #{bounty.issue?.number}</span>
                  </div>

                  <h4 className="text-xl font-bold text-white line-clamp-1">
                    {bounty.issue?.title}
                  </h4>

                  <div className="flex items-center gap-3 mt-1">
                    <PointsBadge points={bounty.points} size="sm" />
                    <UsdcBadge amount={bounty.usdc_amount} size="md" />
                  </div>
                </div>

                <button
                  onClick={() => setSelectedBounty(bounty)}
                  className="w-full md:w-auto px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-base font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all cursor-pointer shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>CLAIM ${bounty.usdc_amount} USDC</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center flex flex-col items-center gap-4">
          <div className="p-3 rounded-full bg-slate-800 text-slate-400">
            <Coins className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Nenhuma recompensa pronta para resgate no usuário atual (@{currentUser.github_username})
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Apenas bounties cujos PRs foram efetivamente mergeados tornam-se <code>CLAIMABLE</code>.
            </p>
          </div>

          {carolUser && carolUser.id !== currentUser.id && (
            <div className="mt-2 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-center gap-4 text-left">
              <div>
                <strong className="text-sm text-emerald-300 block">Dica para a Demonstração:</strong>
                <span className="text-xs text-slate-300">
                  O usuário <strong>@carol-sol</strong> possui uma bounty pronta de $100 USDC (#131).
                </span>
              </div>
              <button
                onClick={() => setCurrentUser(carolUser)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shrink-0"
              >
                Alternar para @carol-sol
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Claim */}
      {selectedBounty && (
        <ClaimModal bounty={selectedBounty} onClose={() => setSelectedBounty(null)} />
      )}
    </div>
  );
};

export default ClaimPage;
