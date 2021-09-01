import { tableFactory } from '@services/Database/Entity';

export interface ProfitDistributorUser {
  distributor: string;
  network: number;
  address: string;
  balance: string;
  earned: string;
  locked: boolean;
  stakeAt: string | null;
  stakeAtDate: Date | null;
  nextLock: string | null;
  nextLockDate: Date | null;
  nextUnlock: string | null;
  nextUnlockDate: Date | null;
  updatedAt: Date;
}

export const tableName = 'profit_distributor_user';

export const profitDistributorUserTableFactory = tableFactory<ProfitDistributorUser>(tableName);

export type ProfitDistributorUserTable = ReturnType<
  ReturnType<typeof profitDistributorUserTableFactory>
>;
