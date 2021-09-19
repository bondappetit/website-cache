import networks from '@bondappetit/networks';
import { RewardHistory } from '@models/Staking/RewardHistory/Service';

export default [
  {
    staking: networks.main.contracts.UsdcStableLPLockStaking.address,
    blockNumber: '12314669',
    totalReward: '5000000',
    totalEarned: '5000000',
  },
  {
    staking: networks.main.contracts.UsdcGovLPStaking.address,
    blockNumber: '12332826',
    totalReward: '500000',
    totalEarned: '500000',
  },
  {
    staking: networks.main.contracts.UsdnGovLPStaking.address,
    blockNumber: '12341914',
    totalReward: '500000',
    totalEarned: '500000',
  },
  {
    staking: networks.main.contracts.UsdcGovLPStaking.address,
    blockNumber: '12521185',
    totalReward: '500000',
    totalEarned: '500000',
  },
  {
    staking: networks.main.contracts.UsdtGovLPStaking.address,
    blockNumber: '12503194',
    totalReward: '500000',
    totalEarned: '500000',
  },
  {
    staking: networks.main.contracts.UsdnGovLPStaking.address,
    blockNumber: '12503194',
    totalReward: '500000',
    totalEarned: '500000',
  },
  {
    staking: networks.mainBSC.contracts.BnbGovLPStaking.address,
    blockNumber: '8173282',
    totalReward: '500000',
    totalEarned: '500000',
  },
  {
    staking: networks.main.contracts.UsdtGovLPStaking.address,
    blockNumber: '12679544',
    totalReward: '500000',
    totalEarned: '500000',
  },
  {
    staking: networks.mainBSC.contracts.BnbGovLPStaking.address,
    blockNumber: '8882482',
    totalReward: '50000',
    totalEarned: '50000',
  },
  {
    staking: networks.main.contracts.StableGovLPStaking.address,
    blockNumber: '12870967',
    totalReward: '1000000',
    totalEarned: '1000000',
  },
  {
    staking: networks.main.contracts.UsdtGovLPStaking.address,
    blockNumber: '12870967',
    totalReward: '50000',
    totalEarned: '50000',
  },
  {
    staking: networks.main.contracts.StableGovLPStaking.address,
    blockNumber: '12870967',
    totalReward: '100000',
    totalEarned: '100000',
  },
  {
    staking: networks.main.contracts.StableGovLPStaking.address,
    blockNumber: '13255523',
    totalReward: '100000',
    totalEarned: '100000',
  },
] as RewardHistory[];
