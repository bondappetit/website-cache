import dotenv from 'dotenv';
dotenv.config();
import * as PriceFeed from '../services/PriceFeed';
import * as VolumeFeed from '../services/VolumeFeed';
import networks from '@bondappetit/networks';
import stakingRewardHistory from './stakingRewardHistory.config';

function int(value: string): number {
  return parseInt(value, 10);
}

export default {
  container: {
    webServer: {
      port: parseInt(process.env.WEBSERVER_PORT ?? '8080', 10),
    },
    database: {
      host: process.env.DATABASE_HOST ?? '',
      port: int(process.env.DATABASE_PORT ?? '5432'),
      user: process.env.DATABASE_USER ?? '',
      password: process.env.DATABASE_PASSWORD ?? '',
      database: process.env.DATABASE_NAME ?? '',
      ssl: process.env.DATABASE_SSL ?? '',
    },
    ethereum: [
      {
        networks: [networks.main.networkId, networks.development.networkId],
        host: process.env.ETH_NODE ?? '',
      },
      {
        networks: [networks.goerli.networkId],
        host: process.env.ETH_GOERLI_NODE ?? '',
      },
      {
        networks: [networks.mainBSC.networkId],
        host: process.env.BSC_NODE ?? '',
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
      ...(networks.main.assets.yGovernance
        ? [
            {
              networks: [networks.main.networkId],
              token: networks.main.assets.yGovernance.address,
              gateway: {
                type: 'coingecko',
                currency: 'usd',
                id: 'bondappetit-gov-token',
              },
            },
          ]
        : []),
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
        networks: [networks.main.networkId],
        token: networks.main.assets.USDC.address,
        gateway: {
          type: 'coingecko',
          currency: 'usd',
          id: 'usd-coin',
        },
      },
      {
        networks: [networks.goerli.networkId],
        token: networks.goerli.assets.Governance.address,
        gateway: {
          type: 'coingecko',
          currency: 'usd',
          id: 'bondappetit-gov-token',
        },
      },
      {
        networks: [networks.goerli.networkId],
        token: networks.goerli.assets.yGovernance.address,
        gateway: {
          type: 'coingecko',
          currency: 'usd',
          id: 'bondappetit-gov-token',
        },
      },
      {
        networks: [networks.goerli.networkId],
        token: networks.goerli.assets.Stable.address,
        gateway: {
          type: 'coingecko',
          currency: 'usd',
          id: 'bond-appetite-usd',
        },
      },
      {
        networks: [networks.goerli.networkId],
        token: networks.goerli.assets.USDC.address,
        gateway: {
          type: 'coingecko',
          currency: 'usd',
          id: 'usd-coin',
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
      {
        networks: [networks.mainBSC.networkId],
        token: networks.mainBSC.assets.BNB.address,
        gateway: {
          type: 'uniswap',
          routerAddress: networks.mainBSC.contracts.UniswapV2Router02.address,
          path: [networks.mainBSC.assets.BNB.address, '0xe9e7cea3dedca5984780bafc599bd69add087d56'], // BNB -> BUSD
        },
      },
    ] as PriceFeed.Config[],
    volumeFeed: [
      {
        networks: [networks.main.networkId],
        token: networks.main.assets.Governance.address,
        gateway: {
          type: 'coingecko',
          currency: 'usd',
          id: 'bondappetit-gov-token',
        },
      },
    ] as VolumeFeed.Config[],
    medium: {
      url: process.env.MEDIUM ?? '',
    },
  },
  stakingRewardHistory,
};
