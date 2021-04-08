import { tableFactory } from '@services/Database/Entity';

export interface UniswapLiquidityPool {
  address: string;
  network: number;
  totalSupply: string;
  totalLiquidityUSD: string;
  dailyVolumeUSD: string;
  updatedAt: Date;
}

export const tableName = 'uniswapLP';

export const uniswapLiquidityPoolTableFactory = tableFactory<UniswapLiquidityPool>(tableName);

export type UniswapLiquidityPoolTable = ReturnType<
  ReturnType<typeof uniswapLiquidityPoolTableFactory>
>;
