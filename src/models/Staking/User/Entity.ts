import { tableFactory } from '@services/Database/Entity';

export interface StakingUser {
  staking: string;
  network: number;
  address: string;
  balance: string;
  earned: string;
  updatedAt: Date;
}

export const tableName = 'staking_user';

export const stakingUserTableFactory = tableFactory<StakingUser>(tableName);

export type StakingUserTable = ReturnType<ReturnType<typeof stakingUserTableFactory>>;
