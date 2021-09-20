import { Factory, singleton } from '@services/Container';
import Web3 from 'web3';
import { HttpProviderOptions, WebsocketProviderOptions } from 'web3-core-helpers';

export interface WebsocketFactoryConfig {
  host: string;
  options?: WebsocketProviderOptions;
}

export interface HttpFactoryConfig {
  host: string;
  options?: HttpProviderOptions;
}

export function wsFactory({ host, options }: WebsocketFactoryConfig) {
  return new Web3(new Web3.providers.WebsocketProvider(host, options));
}

export function httpFactory({ host, options }: HttpFactoryConfig) {
  return new Web3(new Web3.providers.HttpProvider(host, options));
}

export interface HttpNetworkResolverConfig extends HttpFactoryConfig {
  networks: Array<string | number>;
}

export function networkResolverHttpFactory(
  networksConfig: HttpNetworkResolverConfig[],
): NetworkResolverHttp {
  const resolver = networksConfig.reduce(
    (container, config) => ({
      ...container,
      ...config.networks.reduce(
        (container, network) => ({
          ...container,
          [network.toString()]: httpFactory(config),
        }),
        {},
      ),
    }),
    {},
  );

  return {
    networks: resolver,
    get(network: string | number) {
      return this.networks[network.toString()] ? this.networks[network.toString()] : null;
    },
  };
}

export interface NetworkResolverHttp {
  networks: { [network: string]: Web3 };
  get(network: string | number): Web3 | null;
}

interface ContractCallOptions {
  from?: string;
  gasPrice?: string;
  gas?: number;
}

interface ContractCall {
  request(
    options: ContractCallOptions,
    callback?: (err: Error | null, result: string) => void,
  ): any;
}

export function makeBatchRequest(
  web3: Web3,
  calls: ContractCall[],
  options: ContractCallOptions = {},
) {
  const batch = new web3.BatchRequest();
  const promises = calls.map(
    (call) =>
      new Promise<any>((resolve, reject) =>
        batch.add(
          call.request({ from: '0x0000000000000000000000000000000000000000', ...options }, (e, v) =>
            e ? reject(e) : resolve(v),
          ),
        ),
      ),
  );
  batch.execute();

  return Promise.all(promises);
}
