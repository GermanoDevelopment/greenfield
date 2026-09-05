import type { ISolanaService } from '../../core/domain/ports';
import type { Claim } from '../../core/domain/types';

export class SolanaService implements ISolanaService {
  /**
   * Simula a assinatura e envio de transação on-chain para a Solana Devnet
   */
  async signAndExecuteClaim(
    bountyId: string,
    developerWallet: string,
    amountUsdc: number
  ): Promise<Claim> {
    // Pequeno delay para emular a confirmação de blocos na Devnet
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Gera assinatura em Base58 simulada típica de transação Solana
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let randomSig = '';
    for (let i = 0; i < 88; i++) {
      randomSig += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const claim: Claim = {
      id: `claim-${Date.now()}`,
      bounty_id: bountyId,
      developer_id: 'active-dev',
      wallet_address: developerWallet,
      usdc_amount: amountUsdc,
      transaction_signature: randomSig,
      status: 'CONFIRMED',
      created_at: new Date().toISOString(),
    };

    return claim;
  }

  getExplorerUrl(txSignature: string): string {
    return `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
  }
}
