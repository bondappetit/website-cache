import dotenv from 'dotenv';
dotenv.config();
import * as PriceFeed from '../services/PriceFeed';
import networks from '@bondappetit/networks';
import stakingRewardHistory from './stakingRewardHistory.config';

export default {
  container: {
    webServer: {
      port: parseInt(process.env.WEBSERVER_PORT ?? '8080', 10),
    },
    database: {
      host: process.env.DATABASE_HOST ?? '',
      user: process.env.DATABASE_USER ?? '',
      password: process.env.DATABASE_PASSWORD ?? '',
      database: process.env.DATABASE_NAME ?? '',
    },
    ethereum: [
      {
        networks: [
          networks.main.networkId,
          networks.ropsten.networkId,
          networks.development.networkId,
        ],
        host: process.env.ETH_NODE ?? '',
      },
      {
        networks: [networks.mainBSC.networkId],
        host: process.env.BSC_NODE ?? '',
      },
      {
        networks: [networks.testnetBSC.networkId],
        host: process.env.BSC_TESTNET_NODE ?? '',
      },
    ],
    priceFeed: [
      {
        networks: [networks.main.networkId],
        token: networks.main.assets.Governance.address,
        gateway: {
          type: 'coingecko',
          currency: 'usd',
          id: 'bondappetit-gov-token',
        },
      },
      {
        networks: [networks.main.networkId],
        token: networks.main.assets.Stable.address,
        gateway: {
          type: 'coingecko',
          currency: 'usd',
          id: 'bond-appetite-usd',
        },
      },
      {
        networks: [networks.mainBSC.networkId],
        token: networks.mainBSC.assets.bBAG.address,
        gateway: {
          type: 'coingecko',
          currency: 'usd',
          id: 'bondappetit-gov-token',
        },
      },
    ] as PriceFeed.Config[],
    medium: {
      url: process.env.MEDIUM ?? '',
    },
  },
  stakingRewardHistory,
};
