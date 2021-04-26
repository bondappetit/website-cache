import { EthAddress, TxHash } from '@models/types';
import { tableFactory } from '@services/Database/Entity';

export enum TransitType {
  BscWithdraw = 'bscWithdraw',
  EthTransit = 'ethTransit',
}

export interface Transit {
  tx: TxHash;
  network: number;
  type: TransitType;
  owner: EthAddress;
  createdAt: Date;
}

export const tableName = 'burgerswap_bridge_transit';

export const transitTableFactory = tableFactory<Transit>(tableName);

export type TransitTable = ReturnType<ReturnType<typeof transitTableFactory>>;
