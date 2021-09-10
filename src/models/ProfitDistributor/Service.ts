import { Factory } from '@services/Container';
import { cached } from '@services/Database/Entity';
import { Logger } from '@services/Logger/Logger';
import { ProfitDistributor, ProfitDistributorTable } from './Entity';
import BigNumber from 'bignumber.js';
import { Network } from '@services/Network/Network';
import { EthAddress } from '@models/types';
import ProfitDistributorABI from '@bondappetit/networks/abi/ProfitDistributor.json';
import ERC20 from '@bondappetit/networks/abi/ERC20.json';
import { AbiItem } from 'web3-utils';
import { TokenService } from '@models/Token/Service';
import { makeBatchRequest, NetworkResolverHttp } from '@services/Ethereum/Web3';
import dayjs from 'dayjs';

function blockToDate(averageBlockTime: string | number, interval: BigNumber | number | string) {
  return dayjs.unix(
    new BigNumber(Math.floor(Date.now() / 1000))
      .plus(new BigNumber(interval).multipliedBy(averageBlockTime))
      .toNumber(),
  );
}

export function factory(
  logger: Factory<Logger>,
  table: Factory<ProfitDistributorTable>,
  web3Resolver: NetworkResolverHttp,
  tokenService: Factory<TokenService>,
  ttl: number,
) {
  return () => new ProfitDistributorService(logger, table, web3Resolver, tokenService, ttl);
}

export class ProfitDistributorService {
  constructor(
    readonly logger: Factory<Logger> = logger,
    readonly table: Factory<ProfitDistributorTable> = table,
    readonly web3Resolver: NetworkResolverHttp = web3Resolver,
    readonly tokenService: Factory<TokenService> = tokenService,
    readonly ttl: number = ttl,
  ) {}

  async find(network: Network, address: EthAddress): Promise<ProfitDistributor | undefined> {
    const cache = cached(this.table, this.ttl);
    const where = {
      address,
      network: network.data.networkId,
    };

    return cache(where, async () => {
      const web3 = this.web3Resolver.get(network.sid);
      if (!web3) return undefined;

      const contract = new web3.eth.Contract(ProfitDistributorABI.abi as AbiItem[], address);
      const currentBlockNumber = await web3.eth.getBlockNumber();
      const [
        rewardTokenAddress,
        stakingTokenAddress,
        totalSupply,
        periodFinish,
        rewardsDuration,
        lockPeriod,
      ] = await makeBatchRequest(web3, [
        contract.methods.rewardsToken().call,
        contract.methods.stakingToken().call,
        contract.methods.totalSupply().call,
        contract.methods.periodFinish().call,
        contract.methods.rewardsDuration().call,
        contract.methods.lockPeriod().call,
      ]);
      let rewardRate = await contract.methods.rewardRate().call();
      if (new BigNumber(periodFinish).lt(currentBlockNumber)) {
        rewardRate = '0';
      }
      const rewardTokenContract = new web3.eth.Contract(ERC20.abi as AbiItem[], rewardTokenAddress);
      const stakingTokenContract = new web3.eth.Contract(
        ERC20.abi as AbiItem[],
        stakingTokenAddress,
      );
      const [rewardTokenDecimals, stakingTokenDecimals] = await makeBatchRequest(web3, [
        rewardTokenContract.methods.decimals().call,
        stakingTokenContract.methods.decimals().call,
      ]);
      const [rewardToken, stakingToken] = await Promise.all([
        this.tokenService().find(network, rewardTokenAddress.toLowerCase()),
        this.tokenService().find(network, stakingTokenAddress.toLowerCase()),
      ]);
      const rewardTokenPriceUSD = new BigNumber(rewardToken?.priceUSD ?? '0');
      const stakingTokenPriceUSD = new BigNumber(stakingToken?.priceUSD ?? '0');
      let aprPerBlock = new BigNumber(rewardRate)
        .div(new BigNumber(10).pow(rewardTokenDecimals))
        .multipliedBy(rewardTokenPriceUSD)
        .div(
          new BigNumber(totalSupply)
            .div(new BigNumber(10).pow(stakingTokenDecimals))
            .multipliedBy(stakingTokenPriceUSD),
        );
      if (aprPerBlock.isNaN()) aprPerBlock = new BigNumber(0);
      let blocksPerDay = new BigNumber(60)
        .div(network.data.averageBlockTime)
        .multipliedBy(60)
        .multipliedBy(24);
      if (blocksPerDay.isNaN()) blocksPerDay = new BigNumber(0);

      return {
        address,
        network: network.data.networkId,
        rewardToken: rewardTokenAddress.toLowerCase(),
        rewardTokenDecimals,
        stakingToken: stakingTokenAddress.toLowerCase(),
        stakingTokenDecimals,
        totalSupply,
        blockPoolRate: rewardRate,
        periodFinish,
        rewardsDuration,
        lockPeriod,
        lockPeriodDate: blockToDate(network.data.averageBlockTime, lockPeriod).toDate(),
        dailyPoolRate: new BigNumber(rewardRate).multipliedBy(blocksPerDay).toFixed(0),
        aprBlock: aprPerBlock.toString(),
        aprDay: new BigNumber(aprPerBlock).multipliedBy(blocksPerDay).toString(),
        aprWeek: new BigNumber(aprPerBlock).multipliedBy(blocksPerDay.multipliedBy(7)).toString(),
        aprMonth: new BigNumber(aprPerBlock).multipliedBy(blocksPerDay.multipliedBy(30)).toString(),
        aprYear: new BigNumber(aprPerBlock).multipliedBy(blocksPerDay.multipliedBy(365)).toString(),
        updatedAt: new Date(),
      };
    }).catch(({ error, cached }) => {
      this.logger().error(error);
      return cached;
    });
  }
}
