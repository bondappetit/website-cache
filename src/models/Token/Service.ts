import { EthAddress } from '@models/types';
import { cached } from '@services/Database/Entity';
import { Factory } from '@services/Container';
import { Logger } from '@services/Logger/Logger';
import { Network } from '@services/Network/Network';
import * as PriceFeed from '@services/PriceFeed';
import * as VolumeFeed from '@services/VolumeFeed';
import { Token, TokenTable } from './Entity';
import ERC20 from '@bondappetit/networks/abi/ERC20.json';
import { AbiItem } from 'web3-utils';
import axios from 'axios';
import { NetworkResolverHttp } from '@services/Ethereum/Web3';

export function factory(
  logger: Factory<Logger>,
  table: Factory<TokenTable>,
  web3Resolver: NetworkResolverHttp,
  getPriceFeed: PriceFeed.Factory,
  getVolumeFeed: VolumeFeed.Factory,
  ttl: number,
) {
  return () => new TokenService(logger, table, web3Resolver, getPriceFeed, getVolumeFeed, ttl);
}

export class TokenService {
  constructor(
    readonly logger: Factory<Logger> = logger,
    readonly table: Factory<TokenTable> = table,
    readonly web3Resolver: NetworkResolverHttp = web3Resolver,
    readonly getPriceFeed: PriceFeed.Factory = getPriceFeed,
    readonly getVolumeFeed: VolumeFeed.Factory = getVolumeFeed,
    readonly ttl: number = ttl,
  ) {}

  async getLastDayTokenStat(network: Network, address: EthAddress) {
    const urlMap: { [k: number]: string } = {
      1: 'https://api.thegraph.com/subgraphs/name/ianlapham/uniswapv2',
      // 56: 'https://api.thegraph.com/subgraphs/name/bscnodes/pancakeswap',
    };
    const url = urlMap[network.id];
    if (!url) return;

    const res = await axios({
      method: 'post',
      url,
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        query: `{
                tokenDayDatas(
                    first:3
                    orderBy:date
                    orderDirection:desc
                    where:{
                      token:"${address}"
                    }
                ) {
                    priceUSD
                    dailyVolumeUSD
                    totalLiquidityUSD
                }
            }`,
      },
    });
    if (res.status !== 200) throw Error(res.statusText);

    const {
      data: {
        data: { tokenDayDatas },
      },
    } = res;
    if (tokenDayDatas.length == 0) return;

    return {
      priceUSD: tokenDayDatas[0].priceUSD,
      dailyVolumeUSD: tokenDayDatas[0].dailyVolumeUSD,
      totalLiquidityUSD: tokenDayDatas[0].totalLiquidityUSD,
    };
  }

  async find(network: Network, address: EthAddress): Promise<Token | undefined> {
    const cache = cached(this.table, this.ttl);
    const where = {
      address,
      network: network.id,
    };

    return cache(where, async () => {
      const web3 = this.web3Resolver.get(network.sid);
      if (!web3) return undefined;

      const contract = new web3.eth.Contract(ERC20.abi as AbiItem[], address);
      const totalSupply = await contract.methods.totalSupply().call();

      const { name, symbol, decimals } = network.findAssetByAddress(address) ?? {
        name: undefined,
        symbol: undefined,
        decimals: undefined,
      };
      let { priceUSD, dailyVolumeUSD, totalLiquidityUSD } = (await this.getLastDayTokenStat(
        network,
        address,
      )) ?? { priceUSD: '0', dailyVolumeUSD: '0', totalLiquidityUSD: '0' };
      const priceFeed = this.getPriceFeed(network.sid, address);
      if (priceFeed) priceUSD = await priceFeed(priceUSD);
      const volumeFeed = this.getVolumeFeed(network.sid, address);
      if (volumeFeed) dailyVolumeUSD = await volumeFeed(dailyVolumeUSD);

      return {
        address,
        network: network.id,
        name: name ?? (await contract.methods.name().call()),
        symbol: symbol ?? (await contract.methods.symbol().call()),
        decimals: decimals ?? parseInt(await contract.methods.decimals().call(), 10),
        totalSupply,
        priceUSD,
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
