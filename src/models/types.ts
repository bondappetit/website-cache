export type EthAddress = string;

export function isEthAddress(v: string): v is EthAddress {
  return /^0x[a-fA-F0-9]{40}$/.test(v);
}

export type TxHash = string;

export function isEthTxHash(v: string): v is TxHash {
  return /^0x[A-Fa-f0-9]{64}$/.test(v);
}
