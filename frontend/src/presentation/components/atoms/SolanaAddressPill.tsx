import React, { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';

interface SolanaAddressPillProps {
  address: string;
  showExplorerLink?: boolean;
  /** Explorer cluster query value; `null` means mainnet (no query param). */
  explorerCluster?: string | null;
}

export const SolanaAddressPill: React.FC<SolanaAddressPillProps> = ({
  address,
  showExplorerLink = true,
  explorerCluster = 'devnet',
}) => {
  const [copied, setCopied] = useState(false);

  const shortened =
    address.length > 12
      ? `${address.slice(0, 4)}...${address.slice(-4)}`
      : address;

  const explorerUrl =
    explorerCluster === null
      ? `https://explorer.solana.com/address/${address}`
      : `https://explorer.solana.com/address/${address}?cluster=${explorerCluster}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#131A12] border border-[#252E24] text-xs font-mono text-[#D2DFD1]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#28B110]" />
      <span title={address} className="font-semibold">{shortened}</span>

      <button
        type="button"
        onClick={handleCopy}
        className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
        title="Copiar endereço"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      </button>

      {showExplorerLink && (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-slate-400 hover:text-purple-300 transition-colors"
          title="Ver no Solana Explorer"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
};

export default SolanaAddressPill;
