import { EthAddress } from '@models/types';
import { cached } from '@services/Database/Entity';
import { Factory } from '@services/Container';
import { Logger } from '@services/Logger/Logger';
import { Network } from '@services/Network/Network';
import { Wallet, WalletTable } from './Entity';
import { NetworkResolverHttp } from '@services/Ethereum/Web3';

export function factory(
  logger: Logger,
  table: Factory<WalletTable>,
  web3Resolver: NetworkResolverHttp,
  ttl: number,
) {
  return () => new WalletService(logger, table, web3Resolver, ttl);
}

export class WalletService {
  constructor(
    readonly logger: Logger = logger,
    readonly table: Factory<WalletTable> = table,
    readonly web3Resolver: NetworkResolverHttp = web3Resolver,
    readonly ttl: number = ttl,
  ) {}

  async find(network: Network, address: EthAddress): Promise<Wallet | undefined> {
    const cache = cached(this.table, this.ttl);
    const where = {
      address,
      network: network.id,
    };

    return cache(where, async () => {
      const web3 = this.web3Resolver.get(network.sid);
      if (!web3) return undefined;

      try {
        const balance = await web3.eth.getBalance(address);

        return {
          address,
          network: network.id,
          balance,
          updatedAt: new Date(),
        };
      } catch (e) {
        this.logger.error(`Invalid wallet "${network.id}:${address}" request: ${e}`);
        return undefined;
      }
    }).catch(({ error, cached }) => {
      this.logger.error(error);
      return cached;
    });
  }
}
