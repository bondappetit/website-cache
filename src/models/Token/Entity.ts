import { tableFactory } from '@services/Database/Entity';

export interface Token {
  address: string;
  network: number;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  priceUSD: string;
  dailyVolumeUSD: string;
  totalLiquidityUSD: string;
  updatedAt: Date;
}

export const tableName = 'token';

export const tokenTableFactory = tableFactory<Token>(tableName);

export type TokenTable = ReturnType<ReturnType<typeof tokenTableFactory>>;
