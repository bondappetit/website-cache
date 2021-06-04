import { Factory } from '@services/Container';
import axios from 'axios';
import { cached } from '@services/Database/Entity';
import { NetworkResolverHttp } from '@services/Ethereum/Web3';
import { Logger } from '@services/Logger/Logger';
import BigNumber from 'bignumber.js';
import { SwopfiLiquidityPool, SwopfiLiquidityPoolTable } from './Entity';

export interface LiquidityPoolResponseBody {
  success: boolean;
  height: number;
  data: {
    id: string;
    A_asset_balance: string;
    A_asset_id: string;
    B_asset_balance: string;
    B_asset_id: string;
    active: boolean;
    commission: number;
    commission_scale_delimiter: number;
    share_asset_id: string;
    share_asset_supply: string;
    version: string;
    first_harvest_height: number;
    A_asset_init: string;
    B_asset_init: string;
    share_limit_on_first_harvest: string;
    totalLiquidity: string;
    txCount24: string;
    volume24: string;
    lpFees24: string;
    stakingIncome: string;
  };
}

export function factory(
  logger: Factory<Logger>,
  table: Factory<SwopfiLiquidityPoolTable>,
  ttl: number,
) {
  return () => new SwopfiLiquidityPoolService(logger, table, ttl);
}

export class SwopfiLiquidityPoolService {
  constructor(
    readonly logger: Factory<Logger> = logger,
    readonly table: Factory<SwopfiLiquidityPoolTable> = table,
    readonly ttl: number = ttl,
  ) {}

  async find(network: number, address: string): Promise<SwopfiLiquidityPool | undefined> {
    const cache = cached(this.table, this.ttl);
    const where = {
      address,
      network,
    };

    return cache(where, async () => {
      const res = await axios.get<LiquidityPoolResponseBody>(
        `https://backend.swop.fi/exchangers/${address}`,
      );
      if (!res.data.success) return undefined;

      const {
        A_asset_id,
        A_asset_balance,
        B_asset_id,
        B_asset_balance,
        stakingIncome,
        volume24,
        txCount24,
        lpFees24,
        totalLiquidity,
      } = res.data.data;

      return {
        address,
        network,
        token0Address: A_asset_id,
        token0Balance: A_asset_balance,
        token1Address: B_asset_id,
        token1Balance: B_asset_balance,
        incomeUSD: stakingIncome,
        totalLiquidityUSD: totalLiquidity,
        dailyFeesUSD: lpFees24,
        dailyVolumeUSD: volume24,
        dailyTxCount: txCount24,
        aprYear: 0,
        /*
        new BigNumber(stakingIncome)
          .plus(lpFees24)
          .multipliedBy(365)
          .div(totalLiquidity)
          .toString(10),
          */
        updatedAt: new Date(),
      };
    }).catch(({ error, cached }) => {
      this.logger().error(error);
      return cached;
    });
  }
}
