import { Factory } from '@services/Container';
import { Logger } from '@services/Logger/Logger';
import { UniswapLiquidityPool, UniswapLiquidityPoolTable } from './Entity';
import dayjs from 'dayjs';
import axios from 'axios';
import { EthAddress } from '@models/types';
import { Network } from '@services/Network/Network';
import { networkResolverHttpFactory } from '@services/Ethereum/Web3';
import BigNumber from 'bignumber.js';

export function factory(
  logger: Factory<Logger>,
  table: Factory<UniswapLiquidityPoolTable>,
  ttl: number,
) {
  return () => new UniswapLiquidityPoolService(logger, table, ttl);
}

const thegraphUrlMap: { [k: number]: string } = {
  1: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2',
  56: 'https://api.thegraph.com/subgraphs/name/bscnodes/pancakeswap',
};

export class UniswapLiquidityPoolService {
  constructor(
    readonly logger: Factory<Logger> = logger,
    readonly table: Factory<UniswapLiquidityPoolTable> = table,
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
    if (dayRes.status !== 200) throw Error(dayRes.statusText);
    if (hourRes.status !== 200) throw Error(hourRes.statusText);

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
    const where = {
      address,
      network: network.data.networkId,
    };
    const cached = await this.table().where(where).first();
    if (cached && cached.updatedAt >= dayjs().subtract(this.ttl, 'seconds').toDate()) return cached;

    try {
      const { totalSupply, dailyVolumeUSD, totalLiquidityUSD } = (await this.getLastDayPairStat(
        network,
        address,
      )) ?? { totalSupply: '0', dailyVolumeUSD: '0', totalLiquidityUSD: '0' };
      const pair = {
        address,
        network: network.data.networkId,
        totalSupply,
        dailyVolumeUSD,
        totalLiquidityUSD,
        updatedAt: new Date(),
      };
      if (cached) {
        await this.table().update(pair).where(where);
      } else {
        await this.table().insert(pair);
      }

      return pair;
    } catch (e) {
      this.logger().error(`Invalid uniswap API request: ${e}`);
      return undefined;
    }
  }
}
