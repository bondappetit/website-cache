import { Factory } from '@services/Container';
import { cached } from '@services/Database/Entity';
import { Logger } from '@services/Logger/Logger';
import { UniswapLiquidityPool, UniswapLiquidityPoolTable } from './Entity';
import dayjs from 'dayjs';
import axios from 'axios';
import { EthAddress } from '@models/types';
import Pair from '@bondappetit/networks/abi/IUniswapV2Pair.json';
import { AbiItem } from 'web3-utils';
import { Network } from '@services/Network/Network';
import { NetworkResolverHttp, makeBatchRequest } from '@services/Ethereum/Web3';
import BigNumber from 'bignumber.js';
import { TokenService } from '@models/Token/Service';

export function factory(
  logger: Factory<Logger>,
  table: Factory<UniswapLiquidityPoolTable>,
  web3Resolver: NetworkResolverHttp,
  tokenService: Factory<TokenService>,
  ttl: number,
) {
  return () => new UniswapLiquidityPoolService(logger, table, web3Resolver, tokenService, ttl);
}

const thegraphUrlMap: { [k: number]: string } = {
  1: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2',
  // 56: 'https://api.thegraph.com/subgraphs/name/bscnodes/pancakeswap',
};

export class UniswapLiquidityPoolService {
  constructor(
    readonly logger: Factory<Logger> = logger,
    readonly table: Factory<UniswapLiquidityPoolTable> = table,
    readonly web3Resolver: NetworkResolverHttp = web3Resolver,
    readonly tokenService: Factory<TokenService> = tokenService,
    readonly ttl: number = ttl,
  ) {}

  async getLastDayPairStat(network: Network, address: EthAddress) {
    const url = thegraphUrlMap[network.id];
    if (!url) return;

    const [dayRes, hourRes] = await Promise.all([
      axios({
        method: 'post',
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: `{
              pairDayDatas(
                  first:3
                  orderBy:date
                  orderDirection:desc
                  where:{pairAddress:"${address}"}
              ) {
                  totalSupply
                  dailyVolumeUSD
                  reserveUSD
              }
          }`,
        },
      }),
      axios({
        method: 'post',
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          query: `{
              pairHourDatas(
                orderBy:hourStartUnix
                orderDirection:desc
                where:{
                  pair:"${address}"
                  hourStartUnix_gte:${dayjs().add(-24, 'hours').startOf('hour').unix()}
                }
            ) {
              hourlyVolumeUSD
            }
          }`,
        },
      }),
    ]);
    if (dayRes.status !== 200) return undefined;
    if (hourRes.status !== 200) return undefined;

    const {
      data: {
        data: { pairDayDatas },
      },
    } = dayRes;
    if (pairDayDatas.length == 0) return;

    const {
      data: {
        data: { pairHourDatas },
      },
    } = hourRes;
    const dailyVolumeUSD = pairHourDatas.reduce(
      (sum: BigNumber, { hourlyVolumeUSD }: { hourlyVolumeUSD: string }): BigNumber =>
        sum.plus(hourlyVolumeUSD),
      new BigNumber(0),
    );

    return {
      totalSupply: pairDayDatas[0].totalSupply,
      dailyVolumeUSD: dailyVolumeUSD.toString(10),
      totalLiquidityUSD: pairDayDatas[0].reserveUSD,
    };
  }

  async find(network: Network, address: EthAddress): Promise<UniswapLiquidityPool | undefined> {
    const cache = cached(this.table, this.ttl);
    const where = {
      address,
      network: network.data.networkId,
    };

    return cache(where, async () => {
      const web3 = this.web3Resolver.get(network.sid);
      if (!web3) return undefined;

      const contract = new web3.eth.Contract(Pair.abi as AbiItem[], address);
      const [
        totalSupply,
        decimals,
        token0Address,
        token1Address,
        reserves,
      ] = await makeBatchRequest(web3, [
        contract.methods.totalSupply().call,
        contract.methods.decimals().call,
        contract.methods.token0().call,
        contract.methods.token1().call,
        contract.methods.getReserves().call,
      ]);

      const [token0, token1] = await Promise.all([
        this.tokenService().find(network, token0Address.toLowerCase()),
        this.tokenService().find(network, token1Address.toLowerCase()),
      ]);
      const { dailyVolumeUSD } = (await this.getLastDayPairStat(network, address)) ?? {
        dailyVolumeUSD: '0',
      };
      const totalLiquidityUSD = new BigNumber(0)
        .plus(
          new BigNumber(reserves.reserve0)
            .div(new BigNumber(10).pow(token0?.decimals || 1))
            .multipliedBy(token0?.priceUSD || 0),
        )
        .plus(
          new BigNumber(reserves.reserve1)
            .div(new BigNumber(10).pow(token1?.decimals || 1))
            .multipliedBy(token1?.priceUSD || 0),
        )
        .toString();

      return {
        address,
        network: network.data.networkId,
        token0Address: token0Address.toLowerCase(),
        token1Address: token1Address.toLowerCase(),
        token0Decimals: token0?.decimals || 18,
        token1Decimals: token1?.decimals || 18,
        token0Reserve: reserves.reserve0,
        token1Reserve: reserves.reserve1,
        totalSupply: new BigNumber(totalSupply).div(new BigNumber(10).pow(decimals)).toString(),
        dailyVolumeUSD,
        totalLiquidityUSD,
        updatedAt: new Date(),
      };
    }).catch(({ error, cached }) => {
      this.logger().error(error);
      return cached;
    });
  }
}
