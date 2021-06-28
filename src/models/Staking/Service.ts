import { Factory } from '@services/Container';
import { cached } from '@services/Database/Entity';
import { Logger } from '@services/Logger/Logger';
import { Staking, StakingTable, StakingTokenType } from './Entity';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import { Network } from '@services/Network/Network';
import { EthAddress } from '@models/types';
import StakingABI from '@bondappetit/networks/abi/Staking.json';
import ERC20 from '@bondappetit/networks/abi/ERC20.json';
import { AbiItem } from 'web3-utils';
import { TokenService } from '@models/Token/Service';
import { UniswapLiquidityPoolService } from '@models/UniswapLiquidityPool/Service';
import { makeBatchRequest, NetworkResolverHttp } from '@services/Ethereum/Web3';

export function factory(
  logger: Factory<Logger>,
  table: Factory<StakingTable>,
  web3Resolver: NetworkResolverHttp,
  tokenService: Factory<TokenService>,
  pairService: Factory<UniswapLiquidityPoolService>,
  ttl: number,
) {
  return () => new StakingService(logger, table, web3Resolver, tokenService, pairService, ttl);
}

export function symbolToStakingTokenType(symbol: string): StakingTokenType {
  if (['UNI-V2', 'Cake-LP'].includes(symbol)) {
    return StakingTokenType.UniswapLP;
  }

  return StakingTokenType.Plain;
}

export class StakingService {
  constructor(
    readonly logger: Factory<Logger> = logger,
    readonly table: Factory<StakingTable> = table,
    readonly web3Resolver: NetworkResolverHttp = web3Resolver,
    readonly tokenService: Factory<TokenService> = tokenService,
    readonly pairService: Factory<UniswapLiquidityPoolService> = pairService,
    readonly ttl: number = ttl,
  ) {}

  async find(network: Network, address: EthAddress): Promise<Staking | undefined> {
    const cache = cached(this.table, this.ttl);
    const where = {
      address,
      network: network.data.networkId,
    };

    return cache(where, async () => {
      const web3 = this.web3Resolver.get(network.sid);
      if (!web3) return undefined;

      const contract = new web3.eth.Contract(StakingABI.abi as AbiItem[], address);
      const currentBlockNumber = await web3.eth.getBlockNumber();
      const [
        rewardTokenAddress,
        stakingTokenAddress,
        totalSupply,
        periodFinish,
        rewardsDuration,
        stakingEndBlock,
        unstakingStartBlock,
      ] = await makeBatchRequest(web3, [
        contract.methods.rewardsToken().call,
        contract.methods.stakingToken().call,
        contract.methods.totalSupply().call,
        contract.methods.periodFinish().call,
        contract.methods.rewardsDuration().call,
        contract.methods.stakingEndBlock().call,
        contract.methods.unstakingStartBlock().call,
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
      const [
        rewardTokenDecimals,
        stakingTokenDecimals,
        stakingTokenSymbol,
      ] = await makeBatchRequest(web3, [
        rewardTokenContract.methods.decimals().call,
        stakingTokenContract.methods.decimals().call,
        stakingTokenContract.methods.symbol().call,
      ]);
      const [rewardToken, stakingToken] = await Promise.all([
        this.tokenService().find(network, rewardTokenAddress.toLowerCase()),
        this.pairService().find(network, stakingTokenAddress.toLowerCase()),
      ]);
      const rewardTokenPriceUSD = new BigNumber(rewardToken?.priceUSD ?? '0');
      let stakingTokenPriceUSD = new BigNumber(stakingToken?.totalLiquidityUSD ?? '0').div(
        stakingToken?.totalSupply ?? '0',
      );
      if (stakingTokenPriceUSD.isNaN()) stakingTokenPriceUSD = new BigNumber(0);
      let aprPerBlock = new BigNumber(rewardRate)
        .div(new BigNumber(10).pow(rewardTokenDecimals))
        .multipliedBy(rewardTokenPriceUSD)
        .div(
          new BigNumber(totalSupply)
            .div(new BigNumber(10).pow(stakingTokenDecimals))
            .multipliedBy(stakingTokenPriceUSD),
        );
      if (aprPerBlock.isNaN()) aprPerBlock = new BigNumber(0);
      if (aprPerBlock.toNumber() == 0) {
        console.log(
          `currentBlockNumber = ${currentBlockNumber}`,
          `rewardRate = ${rewardRate.toString()}`,
          `rewardTokenPriceUSD = ${rewardTokenPriceUSD.toString()}`,
          `totalSupply = ${totalSupply.toString()}`,
          `stakingTokenPriceUSD = ${stakingTokenPriceUSD.toString()}`,
        );
      }
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
        stakingTokenType: symbolToStakingTokenType(stakingTokenSymbol),
        totalSupply,
        blockPoolRate: rewardRate,
        periodFinish,
        rewardsDuration,
        dailyPoolRate: new BigNumber(rewardRate).multipliedBy(blocksPerDay).toFixed(0),
        stakingEndBlock: stakingEndBlock !== '0' ? stakingEndBlock : null,
        stakingEndDate:
          stakingEndBlock !== '0'
            ? dayjs()
                .add(
                  Math.floor(
                    new BigNumber(stakingEndBlock)
                      .minus(currentBlockNumber)
                      .multipliedBy(network.data.averageBlockTime)
                      .toNumber(),
                  ),
                  'seconds',
                )
                .toDate()
            : null,
        unstakingStartBlock: unstakingStartBlock !== '0' ? unstakingStartBlock : null,
        unstakingStartDate:
          unstakingStartBlock !== '0'
            ? dayjs()
                .add(
                  new BigNumber(unstakingStartBlock)
                    .minus(currentBlockNumber)
                    .multipliedBy(network.data.averageBlockTime)
                    .toNumber(),
                  'seconds',
                )
                .toDate()
            : null,
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
