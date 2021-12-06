import { tableFactory } from '@services/Database/Entity';

export interface UniV3LiquidityPool {
  address: string;
  network: number;
  token0Address: string;
  token1Address: string;
  totalLiquidityUSD: string;
  updatedAt: Date;
}

export const tableName = 'univ3LP';

export const uniV3LiquidityPoolTableFactory = tableFactory<UniV3LiquidityPool>(tableName);

export type UniV3LiquidityPoolTable = ReturnType<ReturnType<typeof uniV3LiquidityPoolTableFactory>>;
