import { EthAddress } from '@models/types';
import { Factory } from '@services/Container';
import { Logger } from '@services/Logger/Logger';
import { Network } from '@services/Network/Network';
import dayjs from 'dayjs';
import { Wallet, WalletTable } from './Entity';
import { NetworkResolverHttp } from '@services/Ethereum/Web3';

export function factory(
  logger: Factory<Logger>,
  table: Factory<WalletTable>,
  web3Resolver: NetworkResolverHttp,
  ttl: number,
) {
  return () => new WalletService(logger, table, web3Resolver, ttl);
}

export class WalletService {
  constructor(
    readonly logger: Factory<Logger> = logger,
    readonly table: Factory<WalletTable> = table,
    readonly web3Resolver: NetworkResolverHttp = web3Resolver,
    readonly ttl: number = ttl,
  ) {}

  async find(network: Network, address: EthAddress): Promise<Wallet | undefined> {
    const where = {
      address,
      network: network.id,
    };
    const cached = await this.table().where(where).first();
    if (cached && cached.updatedAt >= dayjs().subtract(this.ttl, 'seconds').toDate()) return cached;

    const web3 = this.web3Resolver.get(network.sid);
    if (!web3) return undefined;

    try {
      const balance = await web3.eth.getBalance(address);

      const wallet = {
        address,
        network: network.id,
        balance,
        updatedAt: new Date(),
      };

      if (cached) {
        await this.table().update(wallet).where(where);
      } else {
        await this.table().insert(wallet);
      }

      return wallet;
    } catch (e) {
      this.logger().error(`Invalid wallet "${network.id}:${address}" request: ${e}`);
      return undefined;
    }
  }
}