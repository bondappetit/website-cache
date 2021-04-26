import { Staking } from '@models/Staking/Entity';
import { StakingUser } from '@models/Staking/User/Entity';
import BigNumber from 'bignumber.js';
import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { addressScalar, errorType } from '../../types';

export interface StakingUserSource {
  staking: Staking;
  user: StakingUser;
}

export const stakingUserType = new GraphQLObjectType<StakingUserSource>({
  name: 'StakingUserType',
  fields: {
    staking: {
      type: GraphQLNonNull(addressScalar),
      description: 'Staking contract address',
      resolve: ({ user: { staking } }) => staking,
    },
    address: {
      type: GraphQLNonNull(addressScalar),
      description: 'User wallet address',
      resolve: ({ user: { address } }) => address,
    },
    balance: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Staking balance',
      resolve: ({ user: { balance } }) => balance,
    },
    balanceFloat: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Staking balance normalize',
      resolve: ({ user: { balance }, staking: { stakingTokenDecimals } }) => {
        return new BigNumber(balance).div(new BigNumber(10).pow(stakingTokenDecimals)).toString();
      },
    },
    staked: {
      type: GraphQLNonNull(GraphQLBoolean),
      description: 'Is staked',
      resolve: ({ user: { balance } }) => new BigNumber(balance).gt(0),
    },
    earned: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Earned balance',
      resolve: ({ user: { earned } }) => earned,
    },
    earnedFloat: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Earned balance normalize',
      resolve: ({ user: { earned }, staking: { rewardTokenDecimals } }) => {
        return new BigNumber(earned).div(new BigNumber(10).pow(rewardTokenDecimals)).toString();
      },
    },
  },
});
