import { Factory } from '@services/Container';
import { Logger } from '@services/Logger/Logger';
import Web3 from 'web3';
import { Staking, StakingTable } from './Entity';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import { Network } from '@services/Network/Network';
import { EthAddress } from '@models/types';
import StakingABI from '@bondappetit/networks/abi/Staking.json';
import ERC20 from '@bondappetit/networks/abi/ERC20.json';
import { AbiItem } from 'web3-utils';
import { TokenService } from '@models/Token/Service';
import { UniswapLiquidityPoolService } from '@models/UniswapLiquidityPool/Service';

export function factory(
  logger: Factory<Logger>,
  table: Factory<StakingTable>,
  web3: Factory<Web3>,
  tokenService: Factory<TokenService>,
  pairService: Factory<UniswapLiquidityPoolService>,
  ttl: number,
) {
  return () => new StakingService(logger, table, web3(), tokenService, pairService, ttl);
}

export class StakingService {
  constructor(
    readonly logger: Factory<Logger> = logger,
    readonly table: Factory<StakingTable> = table,
    readonly web3: Web3 = web3,
    readonly tokenService: Factory<TokenService> = tokenService,
    readonly pairService: Factory<UniswapLiquidityPoolService> = pairService,
    readonly ttl: number = ttl,
  ) {}

  async find(network: Network, address: EthAddress): Promise<Staking | undefined> {
    const where = {
      address,
      network: network.data.networkId,
    };
    const cached = await this.table().where(where).first();
    if (cached && cached.updatedAt >= dayjs().subtract(this.ttl, 'seconds').toDate()) return cached;

    const contract = new this.web3.eth.Contract(StakingABI.abi as AbiItem[], address);
    try {
      const [
        currentBlockNumber,
        rewardTokenAddress,
        stakingTokenAddress,
        totalSupply,
        rewardRate,
        periodFinish,
        rewardsDuration,
        stakingEndBlock,
        unstakingStartBlock,
      ] = await Promise.all([
        this.web3.eth.getBlockNumber(),
        contract.methods.rewardsToken().call(),
        contract.methods.stakingToken().call(),
        contract.methods.totalSupply().call(),
        contract.methods.rewardRate().call(),
        contract.methods.periodFinish().call(),
        contract.methods.rewardsDuration().call(),
        contract.methods.stakingEndBlock().call(),
        contract.methods.unstakingStartBlock().call(),
      ]);
      const rewardTokenContract = new this.web3.eth.Contract(
        ERC20.abi as AbiItem[],
        rewardTokenAddress,
      );
      const stakingTokenContract = new this.web3.eth.Contract(
        ERC20.abi as AbiItem[],
        stakingTokenAddress,
      );
      const [
        rewardTokenDecimals,
        stakingTokenDecimals,
        rewardToken,
        stakingToken,
      ] = await Promise.all([
        rewardTokenContract.methods.decimals().call(),
        stakingTokenContract.methods.decimals().call(),
        this.tokenService().find(network, rewardTokenAddress.toLowerCase()),
        this.pairService().find(network, stakingTokenAddress.toLowerCase()),
      ]);
      const rewardTokenPriceUSD = rewardToken?.priceUSD ?? '0';
      const stakingTokenPriceUSD = new BigNumber(stakingToken?.totalLiquidityUSD ?? '0')
        .div(stakingToken?.totalSupply ?? '1')
        .toString();

      const staking = {
        address,
        network: network.data.networkId,
        rewardToken: rewardTokenAddress.toLowerCase(),
        rewardTokenDecimals,
        stakingToken: stakingTokenAddress.toLowerCase(),
        stakingTokenDecimals,
        totalSupply,
        blockPoolRate: rewardRate,
        dailyPoolRate: new BigNumber(rewardRate).multipliedBy(4 * 60 * 24).toString(),
        stakingEndBlock: stakingEndBlock !== '0' ? stakingEndBlock : null,
        stakingEndDate:
          stakingEndBlock !== '0'
            ? dayjs()
                .add(
                  new BigNumber(stakingEndBlock)
                    .minus(currentBlockNumber)
                    .multipliedBy(15)
                    .toNumber(),
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
                    .multipliedBy(15)
                    .toNumber(),
                  'seconds',
                )
                .toDate()
            : null,
        roi: new BigNumber(rewardRate)
          .div(new BigNumber(10).pow(rewardTokenDecimals))
          .multipliedBy(rewardTokenPriceUSD)
          .div(new BigNumber(stakingToken?.totalSupply ?? '0').multipliedBy(stakingTokenPriceUSD))
          .multipliedBy(1000000)
          .toString(),
        updatedAt: new Date(),
      };
      if (cached) {
        await this.table().update(staking).where(where);
      } else {
        await this.table().insert(staking);
      }

      return staking;
    } catch (e) {
      this.logger().error(e.toString());
      return undefined;
    }
  }
}
