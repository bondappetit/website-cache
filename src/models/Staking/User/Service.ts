import { Logger } from '@services/Logger/Logger';
import { EthAddress } from '@models/types';
import { Staking } from '../Entity';
import { StakingUser, StakingUserTable } from './Entity';
import dayjs from 'dayjs';
import { Factory } from '@services/Container';
import { makeBatchRequest, NetworkResolverHttp } from '@services/Ethereum/Web3';
import StakingABI from '@bondappetit/networks/abi/Staking.json';
import { AbiItem } from 'web3-utils';

export function factory(
  logger: Factory<Logger>,
  table: Factory<StakingUserTable>,
  web3Resolver: NetworkResolverHttp,
  ttl: number,
) {
  return () => new StakingUserService(logger, table, web3Resolver, ttl);
}

export class StakingUserService {
  constructor(
    readonly logger: Factory<Logger> = logger,
    readonly table: Factory<StakingUserTable> = table,
    readonly web3Resolver: NetworkResolverHttp = web3Resolver,
    readonly ttl: number = ttl,
  ) {}

  async find(staking: Staking, address: EthAddress): Promise<StakingUser | undefined> {
    const where = {
      staking: staking.address,
      network: staking.network,
      address,
    };
    const cached = await this.table().where(where).first();
    if (cached && cached.updatedAt >= dayjs().subtract(this.ttl, 'seconds').toDate()) return cached;

    const web3 = this.web3Resolver.get(staking.network);
    if (!web3) return undefined;

    const contract = new web3.eth.Contract(StakingABI.abi as AbiItem[], staking.address);
    try {
      const [earned, balance] = await makeBatchRequest(web3, [
        contract.methods.earned(address).call,
        contract.methods.balanceOf(address).call,
      ]);

      const stakingUser = {
        staking: staking.address,
        network: staking.network,
        address,
        balance,
        earned,
        updatedAt: new Date(),
      };
      if (cached) {
        await this.table().update(stakingUser).where(where);
      } else {
        await this.table().insert(stakingUser);
      }

      return stakingUser;
    } catch (e) {
      this.logger().error(
        `Invalid staking user "${staking.network}:${staking.address}:${address}" request: ${e}`,
      );
      return undefined;
    }
  }
}
