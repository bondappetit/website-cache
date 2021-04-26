import { tableName } from '@models/Token/Entity';
import { EthAddress, TxHash } from '@models/types';
import { Factory } from '@services/Container';
import { Network } from '@services/Network/Network';
import { Transit, TransitTable, TransitType } from './Entity';

export function factory(table: Factory<TransitTable>) {
  return () => new TransitService(table);
}

export class TransitService {
  constructor(public readonly table: Factory<TransitTable> = table) {}

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
