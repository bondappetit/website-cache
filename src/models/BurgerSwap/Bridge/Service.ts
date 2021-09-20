import { EthAddress, TxHash } from '@models/types';
import { Factory } from '@services/Container';
import { Network } from '@services/Network/Network';
import { Transit, TransitTable, TransitType } from './Entity';

export class TransitService {
  constructor(public readonly table: Factory<TransitTable>) {}

  async add(network: Network, tx: TxHash, type: TransitType, owner: EthAddress): Promise<Transit> {
    const transit = {
      tx,
      network: network.id,
      type,
      owner,
      createdAt: new Date(),
    };
    await this.table().insert(transit);

    return transit;
  }
}
