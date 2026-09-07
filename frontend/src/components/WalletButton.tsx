import { useState, useRef, useEffect, useId, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useClient } from '@solana/react';
import {
  useWallets,
  useConnectedWallet,
  useConnect,
  useDisconnect,
  useIsWalletReady,
} from '@solana/kit-plugin-wallet/react';
import { isAbortError } from '@solana/promises';
import type { UiWallet } from '@wallet-standard/ui';
import {
  Wallet,
  Copy,
  Check,
  ArrowRight,
  X,
  ExternalLink,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react';
import type { AppClient } from '../client';

const COPY_FEEDBACK_MS = 2000;

function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

function walletKey(wallet: UiWallet, index: number): string {
  return `${wallet.name}:${wallet.version}:${index}`;
}

function formatActionError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Algo deu errado. Tente novamente.';
}

export function WalletButton() {
  const client = useClient<AppClient>();
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const isReady = useIsWalletReady(client);
  const connectAction = useConnect(client);
  const disconnectAction = useDisconnect(client);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [selectedWalletKey, setSelectedWalletKey] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!connectAction.isRunning) {
      setSelectedWalletKey(null);
    }
  }, [connectAction.isRunning]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (connectAction.isRunning || disconnectAction.isRunning) return;
      setIsModalOpen(false);
      setIsDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [connectAction.isRunning, disconnectAction.isRunning]);

  const openModal = () => {
    connectAction.reset();
    setIsModalOpen(true);
  };

  const handleConnect = async (wallet: UiWallet, key: string) => {
    if (connectAction.isRunning || disconnectAction.isRunning) return;

    try {
      setSelectedWalletKey(key);
      setCopyError(null);
      await connectAction.dispatchAsync(wallet);
      if (isMountedRef.current) {
        setIsModalOpen(false);
      }
    } catch (err) {
      if (isAbortError(err)) return;
      console.error('Falha ao conectar carteira:', err);
    }
  };

  const handleDisconnect = async () => {
    if (connectAction.isRunning || disconnectAction.isRunning) return;

    try {
      disconnectAction.reset();
      await disconnectAction.dispatchAsync();
      if (isMountedRef.current) {
        setIsDropdownOpen(false);
      }
    } catch (err) {
      if (isAbortError(err)) return;
      console.error('Falha ao desconectar carteira:', err);
    }
  };

  const handleCopyAddress = async () => {
    if (!connected?.account?.address) return;
    try {
      await navigator.clipboard.writeText(connected.account.address);
      if (!isMountedRef.current) return;
      setCopyError(null);
      setCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setCopied(false);
        }
      }, COPY_FEEDBACK_MS);
    } catch (err) {
      console.error('Falha ao copiar endereço:', err);
      if (!isMountedRef.current) return;
      setCopied(false);
      setCopyError('Não foi possível copiar o endereço.');
    }
  };

  const connectErrorMessage = connectAction.isError
    ? formatActionError(connectAction.error)
    : null;
  const disconnectErrorMessage = disconnectAction.isError
    ? formatActionError(disconnectAction.error)
    : null;

  if (!isReady) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-400 rounded-lg text-sm font-medium border border-slate-700 cursor-not-allowed"
      >
        <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
        <span>Carregando...</span>
      </button>
    );
  }

  if (connected?.account) {
    const address = connected.account.address;
    const walletName = connected.wallet?.name || 'Carteira Conectada';
    const walletIcon = connected.wallet?.icon;

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="inline-flex items-center gap-2.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-lg text-sm font-medium border border-slate-700 hover:border-emerald-500/50 transition-all shadow-sm"
          type="button"
          aria-haspopup="menu"
          aria-expanded={isDropdownOpen}
        >
          {walletIcon ? (
            <img src={walletIcon} alt={walletName} className="w-4 h-4 rounded-full object-contain" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
          <span className="font-mono text-xs text-emerald-400">{shortenAddress(address)}</span>
          <ArrowRight className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-90' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div
            className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
            role="menu"
          >
            <div className="px-4 py-2 border-b border-slate-800">
              <div className="flex items-center gap-2 mb-1">
                {walletIcon && <img src={walletIcon} alt="" className="w-3.5 h-3.5 rounded-full" />}
                <span className="text-xs font-semibold text-slate-200 truncate">{walletName}</span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 truncate">{address}</p>
            </div>

            <div className="p-1 space-y-0.5">
              <button
                onClick={handleCopyAddress}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-left"
                type="button"
                role="menuitem"
              >
                <div className="flex items-center gap-2">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar endereço'}</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  openModal();
                }}
                disabled={connectAction.isRunning || disconnectAction.isRunning}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-left disabled:opacity-50"
                type="button"
                role="menuitem"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Trocar carteira</span>
              </button>

              <button
                onClick={handleDisconnect}
                disabled={disconnectAction.isRunning || connectAction.isRunning}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors text-left disabled:opacity-50"
                type="button"
                role="menuitem"
              >
                {disconnectAction.isRunning ? (
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
                <span>Desconectar</span>
              </button>
            </div>

            {(copyError || disconnectErrorMessage) && (
              <p className="px-4 pt-1 pb-2 text-[11px] text-rose-400" role="alert">
                {copyError || disconnectErrorMessage}
              </p>
            )}
          </div>
        )}

        {isModalOpen && (
          <WalletSelectModal
            wallets={wallets}
            isConnecting={connectAction.isRunning}
            selectedWalletKey={selectedWalletKey}
            errorMessage={connectErrorMessage}
            onSelect={handleConnect}
            onClose={() => {
              if (!connectAction.isRunning) setIsModalOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-end gap-1">
      <button
        onClick={openModal}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-emerald-600/20"
        type="button"
      >
        <Wallet className="w-4 h-4" />
        <span>Conectar Carteira</span>
      </button>

      {connectErrorMessage && !isModalOpen && (
        <p className="text-[11px] text-rose-400 max-w-[16rem] text-right" role="alert">
          {connectErrorMessage}
        </p>
      )}

      {isModalOpen && (
        <WalletSelectModal
          wallets={wallets}
          isConnecting={connectAction.isRunning}
          selectedWalletKey={selectedWalletKey}
          errorMessage={connectErrorMessage}
          onSelect={handleConnect}
          onClose={() => {
            if (!connectAction.isRunning) setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

interface WalletSelectModalProps {
  wallets: readonly UiWallet[];
  isConnecting: boolean;
  selectedWalletKey: string | null;
  errorMessage: string | null;
  onSelect: (wallet: UiWallet, key: string) => void;
  onClose: () => void;
}

function WalletSelectModal({
  wallets,
  isConnecting,
  selectedWalletKey,
  errorMessage,
  onSelect,
  onClose,
}: WalletSelectModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    return () => {
      const previous = previouslyFocusedRef.current;
      if (previous && document.contains(previous)) {
        previous.focus();
      }
    };
  }, []);

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return;

    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isConnecting) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl animate-in zoom-in-95 duration-150 outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 id={titleId} className="text-base font-semibold text-white">
                Conectar Carteira
              </h3>
              <p id={descriptionId} className="text-xs text-slate-400">
                Selecione uma carteira Solana
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isConnecting}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Fechar"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
          {wallets.length > 0 ? (
            wallets.map((wallet, index) => {
              const key = walletKey(wallet, index);
              const isCurrentConnecting = isConnecting && selectedWalletKey === key;
              return (
                <button
                  key={key}
                  onClick={() => onSelect(wallet, key)}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all text-left disabled:opacity-50 group"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    {wallet.icon ? (
                      <img src={wallet.icon} alt={wallet.name} className="w-6 h-6 rounded-md object-contain" />
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center">
                        <Wallet className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    )}
                    <span className="font-medium text-sm text-slate-200 group-hover:text-white">
                      {wallet.name}
                    </span>
                  </div>
                  {isCurrentConnecting ? (
                    <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
                  ) : (
                    <span className="text-xs text-slate-500 group-hover:text-slate-400">Detectada</span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-400 mb-4">Nenhuma carteira Solana compatível foi detectada no seu navegador.</p>
              <div className="flex flex-col gap-2">
                <a
                  href="https://phantom.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                >
                  <span>Instalar Phantom</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://solflare.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                >
                  <span>Instalar Solflare</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <p className="mt-3 text-xs text-rose-400" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="mt-5 pt-3 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500">
            Padrão Solana Wallet Standard • Conexão segura
          </p>
        </div>
      </div>
    </div>
  );
}
