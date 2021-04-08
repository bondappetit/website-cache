import { EthAddress } from '@models/types';
import { Factory } from '@services/Container';
import { Logger } from '@services/Logger/Logger';
import { Network } from '@services/Network/Network';
import dayjs from 'dayjs';
import Web3 from 'web3';
import { Token, TokenTable } from './Entity';
import ERC20 from '@bondappetit/networks/abi/ERC20.json';
import { AbiItem } from 'web3-utils';
import axios from 'axios';

export function factory(
  logger: Factory<Logger>,
  table: Factory<TokenTable>,
  web3: Factory<Web3>,
  ttl: number,
) {
  return () => new TokenService(logger, table, web3(), ttl);
}

export class TokenService {
  constructor(
    readonly logger: Factory<Logger> = logger,
    readonly table: Factory<TokenTable> = table,
    readonly web3: Web3 = web3,
    readonly ttl: number = ttl,
  ) {}

  async getLastDayTokenStat(address: EthAddress) {
    const res = await axios({
      method: 'post',
      url: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2',
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
    const where = {
      address,
      network: network.data.networkId,
    };
    const cached = await this.table().where(where).first();
    if (cached && cached.updatedAt >= dayjs().subtract(this.ttl, 'seconds').toDate()) return cached;

    const contract = new this.web3.eth.Contract(ERC20.abi as AbiItem[], address);
    try {
      const totalSupply = await contract.methods.totalSupply().call();

      const { name, symbol, decimals } = network.findAssetByAddress(address) ?? {
        name: undefined,
        symbol: undefined,
        decimals: undefined,
      };

      try {
        const { priceUSD, dailyVolumeUSD, totalLiquidityUSD } = (await this.getLastDayTokenStat(
          address,
        )) ?? { priceUSD: '0', dailyVolumeUSD: '0', totalLiquidityUSD: '0' };
        const token = {
          address,
          network: network.data.networkId,
          name: name ?? (await contract.methods.name().call()),
          symbol: symbol ?? (await contract.methods.symbol().call()),
          decimals: decimals ?? parseInt(await contract.methods.decimals().call(), 10),
          totalSupply,
          priceUSD,
          dailyVolumeUSD,
          totalLiquidityUSD,
          updatedAt: new Date(),
        };
        if (cached) {
          await this.table().update(token).where(where);
        } else {
          await this.table().insert(token);
        }

        return token;
      } catch (e) {
        this.logger().error(`Invalid uniswap API request: ${e}`);
        return undefined;
      }
    } catch {
      return undefined;
    }
  }
}
