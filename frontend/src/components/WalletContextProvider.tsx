import type { FC, ReactNode } from 'react';
import { ClientProvider } from '@solana/react';
import { solanaClient } from '../client';

interface Props {
  children: ReactNode;
}

export const WalletContextProvider: FC<Props> = ({ children }) => {
  return (
    <ClientProvider client={solanaClient}>
      {children}
    </ClientProvider>
  );
};
