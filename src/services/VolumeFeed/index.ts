import { NetworkResolverHttp } from '@services/Ethereum/Web3';
import * as Coingecko from './Coingecko';

export type GatewayConfig = Coingecko.FactoryConfig;

export interface Config {
  networks: Array<string | number>;
  token: string;
  gateway: GatewayConfig;
}

export interface VolumeFeed {
  (def: string): Promise<string>;
}

export function isCoingecko(config: GatewayConfig): config is Coingecko.FactoryConfig {
  return config.type === 'coingecko';
}

export function factory(web3Resolver: NetworkResolverHttp, priceFeedsConfig: Config[]) {
  return (network: string, token: string): VolumeFeed | null => {
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

    return null;
  };
}

export type Factory = ReturnType<typeof factory>;
