import { tableFactory } from '@services/Database/Entity';

export interface SwopfiLiquidityPool {
  address: string;
  network: number;
  token0Address: string;
  token0Balance: string;
  token1Address: string;
  token1Balance: string;
  incomeUSD: string;
  totalLiquidityUSD: string;
  dailyFeesUSD: string;
  dailyVolumeUSD: string;
  dailyTxCount: string;
  aprYear: string;
  updatedAt: Date;
}

export const tableName = 'swapfiLP';

export const swopfiLiquidityPoolTableFactory = tableFactory<SwopfiLiquidityPool>(tableName);

export type SwopfiLiquidityPoolTable = ReturnType<
  ReturnType<typeof swopfiLiquidityPoolTableFactory>
>;
