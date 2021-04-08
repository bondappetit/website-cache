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
  return () => new Web3(new Web3.providers.WebsocketProvider(host, options));
}

export function httpFactory({ host, options }: HttpFactoryConfig) {
  return () => new Web3(new Web3.providers.HttpProvider(host, options));
}
