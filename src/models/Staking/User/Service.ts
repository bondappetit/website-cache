import { Logger } from '@services/Logger/Logger';
import { cached } from '@services/Database/Entity';
import { EthAddress } from '@models/types';
import { Staking } from '../Entity';
import { StakingUser, StakingUserTable } from './Entity';
import { Factory } from '@services/Container';
import { makeBatchRequest, NetworkResolverHttp } from '@services/Ethereum/Web3';
import StakingABI from '@bondappetit/networks/abi/Staking.json';
import { AbiItem } from 'web3-utils';

export class StakingUserService {
  constructor(
    readonly logger: Logger,
    readonly table: Factory<StakingUserTable>,
    readonly web3Resolver: NetworkResolverHttp,
    readonly ttl: number,
  ) {}

  async find(staking: Staking, address: EthAddress): Promise<StakingUser | undefined> {
    const cache = cached(this.table, this.ttl);
    const where = {
      staking: staking.address,
      network: staking.network,
      address,
    };

    return cache(where, async () => {
      const web3 = this.web3Resolver.get(staking.network);
      if (!web3) return undefined;

      const contract = new web3.eth.Contract(StakingABI.abi as AbiItem[], staking.address);
      const [earned, balance] = await makeBatchRequest(web3, [
        contract.methods.earned(address).call,
        contract.methods.balanceOf(address).call,
      ]);

      return {
        staking: staking.address,
        network: staking.network,
        address,
        balance,
        earned,
        updatedAt: new Date(),
      };
    }).catch(({ error, cached }) => {
      this.logger.error(error);
      return cached;
    });
  }
}
