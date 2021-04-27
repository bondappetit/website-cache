import networks from '@bondappetit/networks';
import { RewardHistory } from '@models/Staking/RewardHistory/Service';

export default [
  {
    staking: networks.main.contracts.UsdcStableLPLockStaking.address,
    blockNumber: '12314669',
    totalReward: '1380469',
    totalEarned: '1380469',
  },
] as RewardHistory[];
