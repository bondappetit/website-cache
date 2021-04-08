import { tableFactory } from '@services/Database/Entity';

export interface Staking {
  address: string;
  network: number;
  rewardToken: string;
  rewardTokenDecimals: number;
  stakingToken: string;
  stakingTokenDecimals: number;
  totalSupply: string;
  blockPoolRate: string;
  dailyPoolRate: string;
  stakingEndBlock: string | null;
  stakingEndDate: Date | null;
  unstakingStartBlock: string | null;
  unstakingStartDate: Date | null;
  roi: string;
  updatedAt: Date;
}

export const tableName = 'staking';

export const stakingTableFactory = tableFactory<Staking>(tableName);

export type StakingTable = ReturnType<ReturnType<typeof stakingTableFactory>>;
