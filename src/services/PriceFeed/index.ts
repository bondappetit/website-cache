import { NetworkResolverHttp } from '@services/Ethereum/Web3';
import * as Coingecko from './Coingecko';
import * as Uniswap from './Uniswap';

export type GatewayConfig = Coingecko.FactoryConfig | Uniswap.FactoryConfig;

export interface Config {
  networks: Array<string | number>;
  token: string;
  gateway: GatewayConfig;
}

export interface PriceFeed {
  (def: string): Promise<string>;
}

export function isCoingecko(config: GatewayConfig): config is Coingecko.FactoryConfig {
  return config.type === 'coingecko';
}

export function isUniswap(config: GatewayConfig): config is Uniswap.FactoryConfig {
  return config.type === 'uniswap';
}

export function factory(web3Resolver: NetworkResolverHttp, priceFeedsConfig: Config[]) {
  return (network: string, token: string): PriceFeed | null => {
    const config = priceFeedsConfig.find(
      (config) =>
        config.networks
          .map((networkId) => networkId.toString().toLowerCase())
          .includes(network.toLowerCase()) && config.token.toLowerCase() === token.toLowerCase(),
    );
    if (!config) return null;

    const web3 = web3Resolver.get(network);
    if (!web3) return null;

    if (isCoingecko(config.gateway)) return Coingecko.factory(config.gateway);
    if (isUniswap(config.gateway)) {
      return Uniswap.factory(web3, config.gateway);
    }

    return null;
  };
}

export type Factory = ReturnType<typeof factory>;
