import { tableFactory } from '@services/Database/Entity';

export interface ProfitDistributor {
  address: string;
  network: number;
  rewardToken: string;
  rewardTokenDecimals: number;
  stakingToken: string;
  stakingTokenDecimals: number;
  rewardsDuration: string;
  periodFinish: string;
  totalSupply: string;
  blockPoolRate: string;
  dailyPoolRate: string;
  aprBlock: string;
  aprDay: string;
  aprWeek: string;
  aprMonth: string;
  aprYear: string;
  updatedAt: Date;
}

export const tableName = 'profit_distributor';

export const profitDistributorTableFactory = tableFactory<ProfitDistributor>(tableName);

export type ProfitDistributorTable = ReturnType<ReturnType<typeof profitDistributorTableFactory>>;
