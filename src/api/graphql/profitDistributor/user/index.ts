import { ProfitDistributor } from '@models/ProfitDistributor/Entity';
import { ProfitDistributorUser } from '@models/ProfitDistributor/User/Entity';
import BigNumber from 'bignumber.js';
import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { addressScalar, dateTimeType, errorType } from '../../types';

export interface ProfitDistributorUserSource {
  staking: ProfitDistributor;
  user: ProfitDistributorUser;
}

export const profitDistributorUserType = new GraphQLObjectType<ProfitDistributorUserSource>({
  name: 'ProfitDistributorUserType',
  fields: {
    staking: {
      type: GraphQLNonNull(addressScalar),
      description: 'Staking contract address',
      resolve: ({ user: { distributor } }) => distributor,
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
        return new BigNumber(balance).div(new BigNumber(10).pow(stakingTokenDecimals)).toString(10);
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
        return new BigNumber(earned).div(new BigNumber(10).pow(rewardTokenDecimals)).toString(10);
      },
    },
    stakeAt: {
      type: GraphQLString,
      description: 'Stake at block number',
      resolve: ({ user: { stakeAt } }) => stakeAt,
    },
    stakeAtDate: {
      type: dateTimeType,
      description: 'Stake at date',
      resolve: ({ user: { stakeAtDate } }) => stakeAtDate,
    },
    nextLock: {
      type: GraphQLString,
      description: 'Next lock block number',
      resolve: ({ user: { nextLock } }) => nextLock,
    },
    nextLockDate: {
      type: dateTimeType,
      description: 'Next lock date',
      resolve: ({ user: { nextLockDate } }) => nextLockDate,
    },
    nextUnlock: {
      type: GraphQLString,
      description: 'Next unlock block number',
      resolve: ({ user: { nextUnlock } }) => nextUnlock,
    },
    nextUnlockDate: {
      type: dateTimeType,
      description: 'Next unlock date',
      resolve: ({ user: { nextUnlockDate } }) => nextUnlockDate,
    },
  },
});
