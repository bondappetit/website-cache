import networks from '@bondappetit/networks';
import { RewardHistory } from '@models/Staking/RewardHistory/Service';

export default [
  {
    staking: networks.main.contracts.UsdcStableLPLockStaking.address,
    blockNumber: '12314669',
    totalReward: '1380469',
    totalEarned: '1380469',
  },
  {
    staking: networks.main.contracts.UsdcStableLPLockStaking.address,
    blockNumber: '12452298',
    totalReward: '960942',
    totalEarned: '1460942',
  },
  {
    staking: networks.main.contracts.UsdcGovLPStaking.address,
    blockNumber: '12332826',
    totalReward: '500000',
    totalEarned: '500000',
  },
] as RewardHistory[];
