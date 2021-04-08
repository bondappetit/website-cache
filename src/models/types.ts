export type EthAddress = string;

export function isEthAddress(v: string): v is EthAddress {
  return /^0x[a-fA-F0-9]{40}$/.test(v);
}
