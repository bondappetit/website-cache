import * as Coingecko from './Coingecko';

export type GatewayConfig = Coingecko.FactoryConfig;

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

export function factory(priceFeedsConfig: Config[]) {
  return (network: string, token: string): PriceFeed | null => {
    const config = priceFeedsConfig.find(
      (config) =>
        config.networks
          .map((networkId) => networkId.toString().toLowerCase())
          .includes(network.toLowerCase()) && config.token.toLowerCase() === token.toLowerCase(),
    );
    if (!config) return null;

    if (isCoingecko(config.gateway)) return Coingecko.factory(config.gateway);

    return null;
  };
}

export type Factory = ReturnType<typeof factory>;
