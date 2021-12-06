import { UniV3LiquidityPool } from '@models/UniV3/Entity';
import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { addressScalar, errorType } from '../types';

export const uniswapV3PairType = new GraphQLObjectType<UniV3LiquidityPool>({
  name: 'UniswapV3PairType',
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
    totalLiquidityUSD: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Total liquidity',
    },
  },
});

export const uniswapV3PairPayload = new GraphQLObjectType({
  name: 'UniswapV3PairPayload',
  fields: {
    data: {
      type: uniswapV3PairType,
    },
    error: {
      type: errorType,
    },
  },
});
