import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { WalletButton } from '../../../components/WalletButton';
import { getChainDisplayLabel } from '../../../client';

export const WalletConnectMolecule: React.FC = () => {
  const chainLabel = getChainDisplayLabel();

  return (
    <div className="flex items-center gap-2">
      <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-700/40 text-purple-300 text-xs font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
        <span>{chainLabel}</span>
      </div>

      <WalletButton />
    </div>
  );
};

export default WalletConnectMolecule;
