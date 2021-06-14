import { Factory } from '@services/Container';
import axios from 'axios';
import { cached } from '@services/Database/Entity';
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

export interface RateResponseBody {
  success: boolean;
  height: number;
  data: {
    [asset: string]: {
      rate: string;
    };
  };
}

export interface FarmingInfoResponseBody {
  success: boolean;
  height: number;
  data: Array<{
    pool: string;
    shareToken: string;
    totalShareTokensLoked: string;
  }>;
}

export interface GovernanceResponseBody {
  success: boolean;
  height: number;
  data: Array<{
    key: string;
    type: string;
    value: string;
  }>;
}

export interface AssetInfo {
  assetId: string;
  issueHeight: number;
  issueTimestamp: number;
  issuer: string;
  issuerPublicKey: string;
  name: string;
  description: string;
  decimals: number;
  reissuable: boolean;
  quantity: number;
  scripted: boolean;
  minSponsoredAssetFee: number | null;
  originTransactionId: string;
}

export function factory(
  logger: Factory<Logger>,
  table: Factory<SwopfiLiquidityPoolTable>,
  ttl: number,
) {
  return () => new SwopfiLiquidityPoolService(logger, table, ttl);
}

const swopTokenId = 'Ehie5xYpeN8op1Cctc6aGUrqx8jq3jtf1DSjXDbfm7aT';

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
      const lpRes = await axios.get<LiquidityPoolResponseBody>(
        `https://backend.swop.fi/exchangers/${address}`,
      );
      if (!lpRes.data.success) return undefined;

      const farmingRes = await axios.get<FarmingInfoResponseBody>(
        'https://backend.swop.fi/farming/info',
      );
      if (!farmingRes.data.success) return undefined;
      let { shareToken, totalShareTokensLoked } = farmingRes.data.data.find(
        ({ pool }) => pool === address,
      ) ?? { pool: address, shareToken: '', totalShareTokensLoked: '0' };
      totalShareTokensLoked = new BigNumber(totalShareTokensLoked)
        .div(new BigNumber(10).pow(6))
        .toString(10);

      const shareTokenInfoRes = await axios.get<AssetInfo>(
        `https://nodes.wavesnodes.com/assets/details/${shareToken}`,
      );
      const { decimals: shareTokenDecimals } = shareTokenInfoRes.data || { decimals: 6 };

      const ratesRes = await axios.get<RateResponseBody>('https://backend.swop.fi/assets/rates');
      if (!ratesRes.data.success) return undefined;
      let { rate: swopRate } = ratesRes.data.data[swopTokenId] ?? { rate: '0' };
      swopRate = new BigNumber(swopRate).div(new BigNumber(10).pow(6)).toString(10);
      let { rate: shareRate } = ratesRes.data.data[shareToken] ?? { rate: '' };
      shareRate = new BigNumber(shareRate)
        .div(new BigNumber(10).pow(shareTokenDecimals))
        .toString(10);

      const governanceRes = await axios.get<GovernanceResponseBody>(
        'https://backend.swop.fi/governance',
      );
      if (!governanceRes.data.success) return undefined;
      let { value: poolWeight } = governanceRes.data.data.find(
        ({ key }) => key === `${address}_current_pool_fraction_reward`,
      ) ?? {
        key: `${address}_current_pool_fraction_reward`,
        type: 'int',
        value: '0',
      };
      poolWeight = new BigNumber(poolWeight).div(new BigNumber(10).pow(10)).toString(10);

      const swopAPY =
        totalShareTokensLoked !== '0' && shareRate !== '0'
          ? new BigNumber(1000000)
              .multipliedBy(poolWeight)
              .multipliedBy(swopRate)
              .div(totalShareTokensLoked)
              .div(shareRate)
              .toString(10)
          : '0';

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
      } = lpRes.data.data;

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
        aprYear: new BigNumber(stakingIncome)
          .plus(lpFees24)
          .div(totalLiquidity)
          .multipliedBy(365)
          .plus(swopAPY)
          .toString(10),
        updatedAt: new Date(),
      };
    }).catch(({ error, cached }) => {
      this.logger().error(error);
      return cached;
    });
  }
}
