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
