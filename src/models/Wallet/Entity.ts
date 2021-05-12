import { tableFactory } from '@services/Database/Entity';

export interface Wallet {
  address: string;
  network: number;
  balance: string;
  updatedAt: Date;
}

export const tableName = 'wallet';

export const walletTableFactory = tableFactory<Wallet>(tableName);

export type WalletTable = ReturnType<ReturnType<typeof walletTableFactory>>;
