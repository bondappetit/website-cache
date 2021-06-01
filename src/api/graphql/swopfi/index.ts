import { SwopfiLiquidityPool } from '@models/Swopfi/Entity';
import BigNumber from 'bignumber.js';
import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { errorType } from '../types';

export const swopfiPairType = new GraphQLObjectType<SwopfiLiquidityPool>({
  name: 'SwopfiPairType',
  fields: {
    address: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Pair address',
    },
    token0Address: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Token 0',
    },
    token1Address: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Token 0',
    },
    token0Reserve: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Token 0 reserve',
      resolve: ({ token0Balance }) => token0Balance,
    },
    token0ReserveFloat: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Token 0 reserve normalize',
      resolve: ({ token0Balance }) => new BigNumber(token0Balance).div('1000000').toString(10),
    },
    token1Reserve: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Token 1 reserve',
      resolve: ({ token1Balance }) => token1Balance,
    },
    token1ReserveFloat: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Token 1 reserve normalize',
      resolve: ({ token1Balance }) => new BigNumber(token1Balance).div('1000000').toString(10),
    },
    incomeUSD: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Daily income',
      resolve: ({ incomeUSD }) => new BigNumber(incomeUSD).div('1000000').toString(10),
    },
    totalLiquidityUSD: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Total liquidity',
      resolve: ({ totalLiquidityUSD }) =>
        new BigNumber(totalLiquidityUSD).div('1000000').toString(10),
    },
    dailyFeesUSD: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Daily fees',
      resolve: ({ dailyFeesUSD }) => new BigNumber(dailyFeesUSD).div('1000000').toString(10),
    },
    dailyVolumeUSD: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Daily volume',
      resolve: ({ dailyVolumeUSD }) => new BigNumber(dailyVolumeUSD).div('1000000').toString(10),
    },
    dailyTxCount: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Daily transactions count',
    },
    apr: {
      type: GraphQLNonNull(
        new GraphQLObjectType({
          name: 'SwopfiLPAprType',
          fields: {
            year: {
              type: GraphQLNonNull(GraphQLString),
              description: 'APR per year',
            },
          },
        }),
      ),
      resolve: ({ aprYear }) => ({
        year: aprYear,
      }),
    },
  },
});

export const swopfiPairPayload = new GraphQLObjectType({
  name: 'SwopfiPairPayload',
  fields: {
    data: {
      type: swopfiPairType,
    },
    error: {
      type: errorType,
    },
  },
});
