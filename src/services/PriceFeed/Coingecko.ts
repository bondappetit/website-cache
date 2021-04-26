import axios from 'axios';

export interface FactoryConfig {
  type: 'coingecko';
  currency: 'usd' | 'eur';
  id: string;
}

export function factory({ currency, id }: FactoryConfig) {
  return async (def: string) => {
    try {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=${currency}&include_market_cap=true&include_24hr_vol=false&include_24hr_change=false`,
      );
      return (res.data[id]?.[currency] ?? def).toString();
    } catch (e) {
      return def;
    }
  };
}
