import { Transit, TransitType } from '@models/BurgerSwap/Bridge/Entity';
import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLObjectType,
} from 'graphql';
import { addressScalar, dateTimeType, txHashScalar } from '../../types';

export const transitTypeEnum = new GraphQLEnumType({
  name: 'BurgerSwapBridgeTransitTypeEnum',
  values: {
    [TransitType.BscWithdraw]: {
      description: 'Withdraw BEP20 on Binance',
      value: TransitType.BscWithdraw,
    },
    [TransitType.EthTransit]: {
      description: 'Withdraw ERC20 on Ethereum',
      value: TransitType.EthTransit,
    },
  },
});

export const transitInput = new GraphQLInputObjectType({
  name: 'BurgerSwapBridgeTransitInput',
  fields: {
    tx: {
      type: GraphQLNonNull(txHashScalar),
      description: 'Transaction hash',
    },
    owner: {
      type: GraphQLNonNull(addressScalar),
      description: 'Wallet address of transaction owner',
    },
    type: {
      type: GraphQLNonNull(transitTypeEnum),
      description: 'Transit type',
    },
  },
});

export const transitType = new GraphQLObjectType<Transit>({
  name: 'BurgerSwapBridgeTransitType',
  fields: {
    tx: {
      type: GraphQLNonNull(txHashScalar),
      description: 'Transaction hash',
    },
    type: {
      type: GraphQLNonNull(transitTypeEnum),
      description: 'Transit type',
    },
    owner: {
      type: GraphQLNonNull(addressScalar),
      description: 'Wallet address of transaction owner',
    },
    createdAt: {
      type: GraphQLNonNull(dateTimeType),
      description: 'Created at date',
    },
  },
});
