import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ShieldCheck } from 'lucide-react';
import SolanaAddressPill from '../atoms/SolanaAddressPill';
import { useApp } from '../../context/AppContext';

export const WalletConnectMolecule: React.FC = () => {
  const { currentUser } = useApp();

  return (
    <div className="flex items-center gap-2">
      <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-700/40 text-purple-300 text-xs font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
        <span>Solana Devnet</span>
      </div>

      <div className="hidden md:block">
        <SolanaAddressPill address={currentUser.wallet_address} />
      </div>

      <WalletMultiButton className="!bg-emerald-600 hover:!bg-emerald-700 !rounded-lg !h-9 !px-3.5 !text-xs !font-medium" />
    </div>
  );
};

export default WalletConnectMolecule;
