import { Staking } from '../Entity';

export interface RewardHistory {
  staking: string;
  blockNumber: string;
  totalReward: string;
  totalEarned: string;
}

export class RewardHistoryService {
  constructor(public readonly data: RewardHistory[] = data) {}

  find({ address }: Staking): RewardHistory[] {
    return this.data.filter((rewardHistory) => rewardHistory.staking.toLowerCase() === address);
  }
}
