import { tableFactory } from '@services/Database/Entity';

export enum StakingTokenType {
  Plain = 'plain',
  UniswapLP = 'uniswapLP',
}

export interface Staking {
  address: string;
  network: number;
  rewardToken: string;
  rewardTokenDecimals: number;
  stakingToken: string;
  stakingTokenDecimals: number;
  stakingTokenType: string;
  rewardsDuration: string;
  periodFinish: string;
  totalSupply: string;
  blockPoolRate: string;
  dailyPoolRate: string;
  stakingEndBlock: string | null;
  stakingEndDate: Date | null;
  unstakingStartBlock: string | null;
  unstakingStartDate: Date | null;
  aprBlock: string;
  aprDay: string;
  aprWeek: string;
  aprMonth: string;
  aprYear: string;
  updatedAt: Date;
}

export const tableName = 'staking';

export const stakingTableFactory = tableFactory<Staking>(tableName);

export type StakingTable = ReturnType<ReturnType<typeof stakingTableFactory>>;
