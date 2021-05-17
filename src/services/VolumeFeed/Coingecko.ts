import axios from 'axios';

export interface FactoryConfig {
  type: 'coingecko';
  currency: 'usd';
  id: string;
}

export function factory({ currency, id }: FactoryConfig) {
  return async (def: string) => {
    try {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`,
      );
      return (res.data?.market_data.total_volume[currency] ?? def).toString();
    } catch (e) {
      return def;
    }
  };
}
