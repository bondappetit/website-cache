import { Logger } from '@services/Logger/Logger';
import { cached } from '@services/Database/Entity';
import BigNumber from 'bignumber.js';
import { EthAddress } from '@models/types';
import { ProfitDistributor } from '../Entity';
import { ProfitDistributorUser, ProfitDistributorUserTable } from './Entity';
import { Factory } from '@services/Container';
import { makeBatchRequest, NetworkResolverHttp } from '@services/Ethereum/Web3';
import ProfitDistributorABI from '@bondappetit/networks/abi/ProfitDistributor.json';
import { AbiItem } from 'web3-utils';
import * as Network from '@services/Network/Network';
import dayjs from 'dayjs';

function blockToDate(averageBlockTime: string | number, interval: BigNumber | number | string) {
  return dayjs.unix(
    new BigNumber(Math.floor(Date.now() / 1000))
      .plus(new BigNumber(interval).multipliedBy(averageBlockTime))
      .toNumber(),
  );
}

export class ProfitDistributorUserService {
  constructor(
    readonly logger: Logger,
    readonly table: Factory<ProfitDistributorUserTable>,
    readonly web3Resolver: NetworkResolverHttp,
    readonly networkFactory: typeof Network.factory,
    readonly ttl: number,
  ) {}

  async find(
    distributor: ProfitDistributor,
    address: EthAddress,
  ): Promise<ProfitDistributorUser | undefined> {
    const cache = cached(this.table, this.ttl);
    const where = {
      distributor: distributor.address,
      network: distributor.network,
      address,
    };

    return cache(where, async () => {
      const web3 = this.web3Resolver.get(distributor.network);
      if (!web3) return undefined;

      const contract = new web3.eth.Contract(
        ProfitDistributorABI.abi as AbiItem[],
        distributor.address,
      );
      const currentBlockNumber = await web3.eth.getBlockNumber();
      const [earned, penalty, balance, lockInfo] = await makeBatchRequest(web3, [
        contract.methods.earned(address).call,
        contract.methods.penalty(address).call,
        contract.methods.balanceOf(address).call,
        contract.methods.lockInfo(address).call,
      ]);
      const network = this.networkFactory(distributor.network);
      const staked = new BigNumber(balance).gt(0);

      return {
        distributor: distributor.address,
        network: distributor.network,
        address,
        balance,
        earned,
        penalty,
        locked: lockInfo.locked,
        stakeAt: staked ? lockInfo.stakeAt : null,
        stakeAtDate: staked
          ? blockToDate(
              network.data.averageBlockTime,
              new BigNumber(currentBlockNumber).minus(lockInfo.stakeAt),
            ).toDate()
          : null,
        nextLock: staked ? lockInfo.nextLock : null,
        nextLockDate: staked
          ? blockToDate(
              network.data.averageBlockTime,
              new BigNumber(lockInfo.nextLock).minus(currentBlockNumber),
            ).toDate()
          : null,
        nextUnlock: staked ? lockInfo.nextUnlock : null,
        nextUnlockDate: staked
          ? blockToDate(
              network.data.averageBlockTime,
              new BigNumber(lockInfo.nextUnlock).minus(currentBlockNumber),
            ).toDate()
          : null,
        updatedAt: new Date(),
      };
    }).catch(({ error, cached }) => {
      this.logger.error(error);
      return cached;
    });
  }
}
