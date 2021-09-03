import container from '@container';
import { Staking } from '@models/Staking/Entity';
import { RewardHistory } from '@models/Staking/RewardHistory/Service';
import BigNumber from 'bignumber.js';
import { Request, Response } from 'express';
import networks from '@bondappetit/networks';
import { AbiItem } from 'web3-utils';

export const periodStart = ({ periodFinish, rewardsDuration }: Staking) => {
  if (periodFinish === '0') return '0';

  return new BigNumber(periodFinish).minus(rewardsDuration).toString(10);
};

export const rewardForDuration = ({
  blockPoolRate,
  rewardsDuration,
  rewardTokenDecimals,
}: Staking) => {
  return new BigNumber(blockPoolRate)
    .multipliedBy(rewardsDuration)
    .div(new BigNumber(10).pow(rewardTokenDecimals))
    .toString(10);
};

export const earned = (staking: Staking, currentBlockNumber: number) => {
  const start = periodStart(staking);
  if (start === '0') return '0';

  return new BigNumber(currentBlockNumber)
    .minus(start)
    .multipliedBy(staking.blockPoolRate)
    .div(new BigNumber(10).pow(staking.rewardTokenDecimals))
    .toString(10);
};

export async function getCircl(req: Request, res: Response) {
  const mainETHNetwork = container.network(1);
  const mainBSCNetwork = container.network(56);
  const stakingAddresses = [
    {
      network: mainETHNetwork,
      address: mainETHNetwork.data.contracts.UsdcGovLPStaking.address,
    },
    {
      network: mainETHNetwork,
      address: mainETHNetwork.data.contracts.UsdcStableLPLockStaking.address,
    },
    {
      network: mainETHNetwork,
      address: mainETHNetwork.data.contracts.UsdnGovLPStaking.address,
    },
    {
      network: mainETHNetwork,
      address: mainETHNetwork.data.contracts.UsdtGovLPStaking.address,
    },
    {
      network: mainETHNetwork,
      address: mainETHNetwork.data.contracts.StableGovLPStaking.address,
    },
    {
      network: mainBSCNetwork,
      address: mainBSCNetwork.data.contracts.BnbGovLPStaking.address,
    },
  ];
  const currentBlockNumber = new Map();
  const mainEthProvider = container.ethereum.get(mainETHNetwork.id);
  if (!mainEthProvider) return res.send('0');
  const mainBscProvider = container.ethereum.get(mainBSCNetwork.id);
  if (!mainBscProvider) return res.send('0');
  currentBlockNumber.set(mainETHNetwork.id, await mainEthProvider.eth.getBlockNumber());
  currentBlockNumber.set(mainBSCNetwork.id, await mainBscProvider.eth.getBlockNumber());

  const stakingService = container.model.stakingService();
  const stakingRewardHistoryService = container.model.stakingRewardHistory();
  const stakings = await stakingAddresses.reduce(async (prev, { network, address }) => {
    const res = await prev;

    const staking = await stakingService.find(network, address.toLowerCase());
    if (!staking) return res;

    const rewardHistory = await stakingRewardHistoryService.find(staking);

    return [
      ...res,
      { staking, rewardHistory, currentBlock: currentBlockNumber.get(network.id) ?? 0 },
    ];
  }, Promise.resolve([]) as Promise<Array<{ staking: Staking; rewardHistory: RewardHistory[]; currentBlock: number }>>);

  const { totalEarned, totalSupply } = stakings.reduce(
    (result, { staking, rewardHistory, currentBlock }) => {
      const totalEarnedSum = rewardHistory.reduce(
        (result, { totalEarned }) => result.plus(totalEarned),
        new BigNumber('0'),
      );
      const totalSupplySum = rewardHistory.reduce(
        (result, { totalReward }) => result.plus(totalReward),
        new BigNumber('0'),
      );

      return {
        totalEarned: result.totalEarned.plus(earned(staking, currentBlock)).plus(totalEarnedSum),
        totalSupply: result.totalSupply.plus(rewardForDuration(staking)).plus(totalSupplySum),
      };
    },
    { totalEarned: new BigNumber('0'), totalSupply: new BigNumber('0') },
  );

  const bag = new mainEthProvider.eth.Contract(
    networks.main.contracts.Governance.abi as AbiItem[],
    networks.main.contracts.Governance.address,
  );
  const balance = await bag.methods.balanceOf('0x5D17016bF168FfF34177A53474B949dEBd87ca40').call();
  const balanceNormalize = new BigNumber(balance).div(
    new BigNumber(10).pow(networks.main.assets.Governance.decimals),
  );

  return res.send(
    new BigNumber(totalEarned).plus(new BigNumber('500000').minus(balanceNormalize)).toString(10),
  );
}
