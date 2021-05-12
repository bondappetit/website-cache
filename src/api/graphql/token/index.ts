import { Token } from '@models/Token/Entity';
import BigNumber from 'bignumber.js';
import { GraphQLInt, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { addressScalar, errorType } from '../types';

export const tokenType = new GraphQLObjectType<Token>({
  name: 'TokenType',
  fields: {
    address: {
      type: GraphQLNonNull(addressScalar),
      description: 'Token address',
    },
    name: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Token name',
    },
    symbol: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Token symbol',
    },
    decimals: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'Token decimals',
    },
    totalSupply: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Token total supply',
    },
    totalSupplyFloat: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Token total supply normalize',
      resolve: ({ totalSupply, decimals }) => {
        return new BigNumber(totalSupply).div(new BigNumber(10).pow(decimals)).toString(10);
      },
    },
    priceUSD: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Token price at USD',
    },
    statistic: {
      type: new GraphQLObjectType({
        name: 'TokenStatisticType',
        fields: {
          dailyVolumeUSD: {
            type: GraphQLNonNull(GraphQLString),
            description: 'Token daily volume at USD',
          },
          totalLiquidityUSD: {
            type: GraphQLNonNull(GraphQLString),
            description: 'Token total liquidity at USD',
          },
        },
      }),
      resolve: (root) => root,
    },
  },
});

export const tokenPayload = new GraphQLObjectType({
  name: 'TokenPayload',
  fields: {
    data: {
      type: tokenType,
    },
    error: {
      type: errorType,
    },
  },
});
