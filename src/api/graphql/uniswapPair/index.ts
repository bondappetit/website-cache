import { UniswapLiquidityPool } from '@models/UniswapLiquidityPool/Entity';
import BigNumber from 'bignumber.js';
import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { addressScalar, errorType } from '../types';

export const uniswapPairType = new GraphQLObjectType<UniswapLiquidityPool>({
  name: 'UniswapPairType',
  fields: {
    address: {
      type: GraphQLNonNull(addressScalar),
      description: 'Pair address',
    },
    token0Address: {
      type: GraphQLNonNull(addressScalar),
      description: 'Token 0',
    },
    token1Address: {
      type: GraphQLNonNull(addressScalar),
      description: 'Token 1',
    },
    token0Reserve: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Token 0 reserve',
    },
    token0ReserveFloat: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Token 0 reserve normalize',
      resolve: ({ token0Reserve, token0Decimals }) => {
        return new BigNumber(token0Reserve).div(new BigNumber(10).pow(token0Decimals)).toString(10);
      },
    },
    token1Reserve: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Token 1 reserve',
    },
    token1ReserveFloat: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Token 1 reserve normalize',
      resolve: ({ token1Reserve, token1Decimals }) => {
        return new BigNumber(token1Reserve).div(new BigNumber(10).pow(token1Decimals)).toString(10);
      },
    },
    totalSupplyFloat: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Pair total supply normalize',
      resolve: ({ totalSupply }) => totalSupply,
    },
    statistic: {
      type: new GraphQLObjectType({
        name: 'UniswapPairStatisticType',
        fields: {
          dailyVolumeUSD: {
            type: GraphQLNonNull(GraphQLString),
            description: 'Pair daily volume at USD',
          },
          totalLiquidityUSD: {
            type: GraphQLNonNull(GraphQLString),
            description: 'Pair total liquidity at USD',
          },
        },
      }),
      resolve: (root) => root,
    },
  },
});

export const uniswapPairPayload = new GraphQLObjectType({
  name: 'UniswapPairPayload',
  fields: {
    data: {
      type: uniswapPairType,
    },
    error: {
      type: errorType,
    },
  },
});
