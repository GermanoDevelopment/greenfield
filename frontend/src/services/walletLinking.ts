import { getBase58Decoder } from '@solana/kit';
import { getWalletAccountFeature } from '@wallet-standard/ui-features';
import { greenfieldApi, type ApiUserOut } from './api';

export async function signAndLinkWallet(
  walletAccount: { address: string; [key: string]: any },
  walletOrFeatures?: any
): Promise<ApiUserOut> {
  // 1. Solicita desafio criptográfico (nonce) ao backend
  const challenge = await greenfieldApi.getWalletChallenge();
  const messageBytes = new TextEncoder().encode(challenge.message);

  let signatureBytes: Uint8Array | null = null;

  // 2. Tenta o padrão Wallet Standard 'solana:signMessage'
  let signFeature: any = null;
  try {
    signFeature = getWalletAccountFeature(walletAccount as any, 'solana:signMessage' as any);
  } catch {
    // continua fallback se não encontrado via helper
  }

  if (!signFeature && walletOrFeatures) {
    signFeature = walletOrFeatures['solana:signMessage'] || walletOrFeatures.features?.['solana:signMessage'];
  }

  if (!signFeature && (walletAccount as any)?.features) {
    signFeature = (walletAccount as any).features['solana:signMessage'];
  }

  if (signFeature && typeof signFeature.signMessage === 'function') {
    const results = await signFeature.signMessage({
      account: walletAccount,
      message: messageBytes,
    });
    if (results && results.length > 0) {
      signatureBytes = results[0].signature;
    }
  } else if ((window as any)?.solana?.signMessage) {
    // Fallback para extensões com injeção direta no window
    const res = await (window as any).solana.signMessage(messageBytes, 'utf8');
    signatureBytes = res.signature;
  } else {
    throw new Error(
      'A carteira conectada não suporta a funcionalidade de assinatura de mensagem (signMessage).'
    );
  }

  if (!signatureBytes) {
    throw new Error('Assinatura não obtida da carteira.');
  }

  // 3. Converte a assinatura binária em Base58
  const base58Sig = getBase58Decoder().decode(signatureBytes);

  // 4. Submete a prova de posse ao backend para vinculação segura
  const updatedUser = await greenfieldApi.verifyWallet(walletAccount.address, challenge.nonce, base58Sig);

  return updatedUser;
}
