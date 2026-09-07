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
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#182017] text-[#889887] rounded-xl text-xs font-medium border border-[#283426] cursor-not-allowed"
      >
        <Sparkles className="w-3.5 h-3.5 animate-spin text-[#28B110]" />
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
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#182017] hover:bg-[#1E281C] text-white rounded-xl text-xs font-semibold border border-[#283426] hover:border-[#28B110]/60 transition-all shadow-xs cursor-pointer"
          type="button"
          aria-haspopup="menu"
          aria-expanded={isDropdownOpen}
        >
          {walletIcon ? (
            <img src={walletIcon} alt={walletName} className="w-4 h-4 rounded-full object-contain" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-[#28B110] animate-pulse" />
          )}
          <span className="font-mono text-xs text-[#28B110] font-bold">{shortenAddress(address)}</span>
          <svg className={`w-3.5 h-3.5 text-[#889887] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {isDropdownOpen && (
          <div
            className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#141C14] border border-[#283426] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
            role="menu"
          >
            <div className="px-4 py-2 border-b border-[#283426]/70">
              <div className="flex items-center gap-2 mb-1">
                {walletIcon && <img src={walletIcon} alt="" className="w-3.5 h-3.5 rounded-full" />}
                <span className="text-xs font-bold text-white truncate">{walletName}</span>
              </div>
              <p className="text-[11px] font-mono text-[#889887] truncate">{address}</p>
            </div>

            <div className="p-1 space-y-0.5">
              <button
                onClick={handleCopyAddress}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#D2DFD1] hover:text-[#28B110] hover:bg-[#182017] rounded-xl transition-colors text-left cursor-pointer"
                type="button"
                role="menuitem"
              >
                <div className="flex items-center gap-2">
                  {copied ? <Check className="w-3.5 h-3.5 text-[#28B110]" /> : <Copy className="w-3.5 h-3.5 text-[#889887]" />}
                  <span>{copied ? 'Copiado!' : 'Copiar endereço'}</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  openModal();
                }}
                disabled={connectAction.isRunning || disconnectAction.isRunning}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#D2DFD1] hover:text-[#28B110] hover:bg-[#182017] rounded-xl transition-colors text-left disabled:opacity-50 cursor-pointer"
                type="button"
                role="menuitem"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#889887]" />
                <span>Trocar carteira</span>
              </button>

              <button
                onClick={handleDisconnect}
                disabled={disconnectAction.isRunning || connectAction.isRunning}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors text-left disabled:opacity-50 cursor-pointer"
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
        className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#28B110] hover:bg-[#20920C] active:bg-[#1A7709] text-[#101410] rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer"
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
        className="relative w-full max-w-sm rounded-2xl bg-[#141C14] border border-[#283426] p-6 shadow-2xl animate-in zoom-in-95 duration-150 outline-none text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#283426]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#1B261A] text-[#28B110] border border-[#28B110]/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 id={titleId} className="text-base font-bold text-white">
                Conectar Carteira
              </h3>
              <p id={descriptionId} className="text-xs text-[#889887]">
                Selecione uma carteira Solana
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isConnecting}
            className="p-1.5 rounded-lg text-[#889887] hover:text-white hover:bg-[#182017] transition-colors disabled:opacity-50 cursor-pointer"
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
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#182017] hover:bg-[#1E281C] border border-[#283426] hover:border-[#28B110]/50 transition-all text-left disabled:opacity-50 group cursor-pointer"
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    {wallet.icon ? (
                      <img src={wallet.icon} alt={wallet.name} className="w-6 h-6 rounded-md object-contain" />
                    ) : (
                      <div className="w-6 h-6 rounded-md bg-[#1B261A] border border-[#283426] flex items-center justify-center">
                        <Wallet className="w-3.5 h-3.5 text-[#28B110]" />
                      </div>
                    )}
                    <span className="font-semibold text-sm text-[#D2DFD1] group-hover:text-[#28B110]">
                      {wallet.name}
                    </span>
                  </div>
                  {isCurrentConnecting ? (
                    <Sparkles className="w-4 h-4 animate-spin text-[#28B110]" />
                  ) : (
                    <span className="text-xs text-[#889887] group-hover:text-[#28B110]">Detectada</span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-[#889887] mb-4">Nenhuma carteira Solana compatível foi detectada no seu navegador.</p>
              <div className="flex flex-col gap-2">
                <a
                  href="https://phantom.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#182017] hover:bg-[#1E281C] border border-[#283426] text-[#28B110] rounded-xl text-xs font-semibold transition-colors"
                >
                  <span>Instalar Phantom</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://solflare.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#182017] hover:bg-[#1E281C] border border-[#283426] text-[#28B110] rounded-xl text-xs font-semibold transition-colors"
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

        <div className="mt-5 pt-3 border-t border-[#283426]/70 text-center">
          <p className="text-[11px] text-[#889887]">
            Padrão Solana Wallet Standard • Conexão segura
          </p>
        </div>
      </div>
    </div>
  );
}
