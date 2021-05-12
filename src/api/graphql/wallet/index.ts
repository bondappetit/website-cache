import { Wallet } from '@models/Wallet/Entity';
import BigNumber from 'bignumber.js';
import { GraphQLInt, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { addressScalar, errorType } from '../types';

export const walletType = new GraphQLObjectType<Wallet>({
  name: 'WalletType',
  fields: {
    address: {
      type: GraphQLNonNull(addressScalar),
      description: 'Wallet address',
    },
    balance: {
      type: GraphQLNonNull(GraphQLString),
      description: 'ETH balance',
    },
    balanceFloat: {
      type: GraphQLNonNull(GraphQLString),
      description: 'ETH balance normalize',
      resolve: ({ balance }) => {
        return new BigNumber(balance).div(new BigNumber(10).pow(18)).toString(10);
      },
    },
  },
});

export const walletPayload = new GraphQLObjectType({
  name: 'WalletPayload',
  fields: {
    data: {
      type: walletType,
    },
    error: {
      type: errorType,
    },
  },
});
