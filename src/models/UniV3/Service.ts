import { EthAddress } from '@models/types';
import { Factory } from '@services/Container';
import { Logger } from '@services/Logger/Logger';
import { Network } from '@services/Network/Network';
import axios from 'axios';
import { cached } from '@services/Database/Entity';
import { UniV3LiquidityPool, UniV3LiquidityPoolTable } from './Entity';

const urlMap: { [k: number]: string } = {
  1: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
};

export class UniV3LiquidityPoolService {
  constructor(
    readonly logger: Logger,
    readonly table: Factory<UniV3LiquidityPoolTable>,
    readonly ttl: number,
  ) {}

  async getLastPoolStat(network: Network, address: EthAddress) {
    const url = urlMap[network.id];
    if (!url) return;

    const res = await axios.post<{
      data: {
        pool: null | {
          id: string;
          token0: { id: string };
          token1: { id: string };
          totalValueLockedUSD: string;
        };
      };
    }>(
      url,
      {
        query: `{
		pool(
			id:"${address}"
			subgraphError: allow
		) {
			id
			token0 { id }
			token1 { id }
			totalValueLockedUSD
		}
	}`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    if (res.status !== 200) return undefined;

    const {
      data: {
        data: { pool },
      },
    } = res;
    if (pool === null) return;

    return pool;
  }

  async find(network: Network, address: EthAddress): Promise<UniV3LiquidityPool | undefined> {
    const cache = cached(this.table, this.ttl);
    const where = {
      address,
      network: network.id,
    };

    return cache(where, async () => {
      const poolStat = await this.getLastPoolStat(network, address);
      if (!poolStat) throw new Error('Pool not found');

      return {
        address,
        network: network.id,
        token0Address: poolStat.token0.id,
        token1Address: poolStat.token1.id,
        totalLiquidityUSD: poolStat.totalValueLockedUSD,
        updatedAt: new Date(),
      };
    }).catch(({ error, cached }) => {
      this.logger.error(error);
      return cached;
    });
  }
}
