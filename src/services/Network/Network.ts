import networks from '@bondappetit/networks';
import { EthAddress } from '@models/types';

export interface Asset {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

export function factory(networkId: number) {
  return new Network(
    Object.values(networks).find((network) => network.networkId === networkId) ?? networks.main,
  );
}

export class Network {
  constructor(readonly data: typeof networks.main) {}

  get id() {
    return this.data.networkId;
  }

  get sid() {
    return this.id.toString();
  }

  private normalizeAsset(asset: typeof networks.main.assets.DAI | undefined) {
    if (!asset) return undefined;

    return {
      ...asset,
      totalSupply: '0',
    };
  }

  findAssetByAddress(address: EthAddress) {
    return this.normalizeAsset(
      Object.values(this.data.assets).find((asset) => asset.address.toLowerCase() === address.toLowerCase()),
    );
  }

  findAssetBySymbol(symbol: string) {
    return this.normalizeAsset(
      Object.values(this.data.assets).find((asset) => asset.symbol === symbol),
    );
  }
}
