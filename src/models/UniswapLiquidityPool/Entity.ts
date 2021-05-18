import { tableFactory } from '@services/Database/Entity';

export interface UniswapLiquidityPool {
  address: string;
  network: number;
  token0Address: string;
  token1Address: string;
  token0Decimals: number;
  token1Decimals: number;
  token0Reserve: string;
  token1Reserve: string;
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
