import { Staking, StakingTokenType } from '@models/Staking/Entity';
import { Request } from 'express';
import BigNumber from 'bignumber.js';
import container from '@container';
import {
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { addressScalar, dateTimeType, errorType } from '../types';
import { StakingUserSource, stakingUserType } from './user';
import { tokenType } from '../token';
import { uniswapPairType } from '../uniswapPair';
import { RewardHistory } from '@models/Staking/RewardHistory/Service';

export const rewardHistoryType = new GraphQLObjectType<RewardHistory, Request>({
  name: 'StakingRewardHistoryType',
  fields: {
    blockNumber: {
      type: GraphQLNonNull(GraphQLString),
      description: 'History block number',
    },
    totalReward: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Distributable reward',
    },
    totalEarned: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Distributed reward',
    },
  },
});

export const periodStart = ({ periodFinish, rewardsDuration }: Staking) => {
  if (periodFinish === '0') return '0';

  return new BigNumber(periodFinish).minus(rewardsDuration).toString(10);
};

export const rewardForDuration = ({ blockPoolRate, rewardsDuration }: Staking) => {
  return new BigNumber(blockPoolRate).multipliedBy(rewardsDuration).toString(10);
};

export const earned = (staking: Staking, { currentBlockNumber }: Request) => {
  const start = periodStart(staking);
  if (start === '0') return '0';

  return new BigNumber(currentBlockNumber)
    .minus(start)
    .multipliedBy(staking.blockPoolRate)
    .toString(10);
};

export const stakingType = new GraphQLObjectType<Staking, Request>({
  name: 'StakingType',
  fields: {
    address: {
      type: GraphQLNonNull(addressScalar),
      description: 'Staking contract address',
    },
    stakingToken: {
      type: GraphQLNonNull(addressScalar),
      description: 'Staking token address',
    },
    stakingTokenDecimals: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'Staking token decimals',
    },
    stakingTokenPlain: {
      type: tokenType,
      description: 'Plain staking token',
      resolve: ({ stakingToken, stakingTokenType }, args, { currentNetwork }) => {
        if (stakingTokenType !== StakingTokenType.Plain) return null;

        return container.model.uniswapLPService.find(currentNetwork, stakingToken);
      },
    },
    stakingTokenUniswap: {
      type: uniswapPairType,
      description: 'Uniswap LP staking token',
      resolve: ({ stakingToken, stakingTokenType }, args, { currentNetwork }) => {
        if (stakingTokenType !== StakingTokenType.UniswapLP) return null;

        return container.model.uniswapLPService.find(currentNetwork, stakingToken);
      },
    },
    rewardToken: {
      type: GraphQLNonNull(addressScalar),
      description: 'Reward token address',
    },
    rewardTokenDecimals: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'Reward token decimals',
    },
    totalSupply: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Staking total supply',
    },
    totalSupplyFloat: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Staking total supply normalize',
      resolve: ({ totalSupply, stakingTokenDecimals }) => {
        return new BigNumber(totalSupply)
          .div(new BigNumber(10).pow(stakingTokenDecimals))
          .toString(10);
      },
    },
    periodStart: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Block number of staking period start',
      resolve: (staking) => periodStart(staking),
    },
    periodFinish: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Block number of staking period finish',
    },
    rewardsDuration: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Rewards duration',
    },
    rewardForDuration: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Reward for duration',
      resolve: (staking: Staking) => {
        return rewardForDuration(staking);
      },
    },
    rewardForDurationFloat: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Reward for duration normalize',
      resolve: (staking: Staking) => {
        return new BigNumber(rewardForDuration(staking))
          .div(new BigNumber(10).pow(staking.rewardTokenDecimals))
          .toString(10);
      },
    },
    earned: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Already earned',
      resolve: (staking, args, request) => {
        return earned(staking, request);
      },
    },
    earnedFloat: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Already earned normalize',
      resolve: (staking, args, request) => {
        return new BigNumber(earned(staking, request))
          .div(new BigNumber(10).pow(staking.rewardTokenDecimals))
          .toString(10);
      },
    },
    poolRate: {
      type: GraphQLNonNull(
        new GraphQLObjectType({
          name: 'StakingPoolRateType',
          fields: {
            block: {
              type: GraphQLNonNull(GraphQLString),
              description: 'Pool rate per block',
            },
            blockFloat: {
              type: GraphQLNonNull(GraphQLString),
              description: 'Pool rate per block normalize',
              resolve: ({ block, decimals }) => {
                return new BigNumber(block).div(new BigNumber(10).pow(decimals)).toString(10);
              },
            },
            daily: {
              type: GraphQLNonNull(GraphQLString),
              description: 'Pool rate per day',
            },
            dailyFloat: {
              type: GraphQLNonNull(GraphQLString),
              description: 'Pool rate per day normalize',
              resolve: ({ daily, decimals }) => {
                return new BigNumber(daily).div(new BigNumber(10).pow(decimals)).toString(10);
              },
            },
          },
        }),
      ),
      resolve: ({ rewardTokenDecimals, blockPoolRate, dailyPoolRate }) => ({
        decimals: rewardTokenDecimals,
        block: blockPoolRate,
        daily: dailyPoolRate,
      }),
    },
    stakingEnd: {
      type: GraphQLNonNull(
        new GraphQLObjectType({
          name: 'StakingStakingEndType',
          fields: {
            block: {
              type: GraphQLString,
              description: 'Block number of end staking',
            },
            date: {
              type: dateTimeType,
              description: 'Date of end staking',
            },
          },
        }),
      ),
      resolve: ({ stakingEndBlock, stakingEndDate }) => ({
        block: stakingEndBlock,
        date: stakingEndDate,
      }),
    },
    unstakingStart: {
      type: GraphQLNonNull(
        new GraphQLObjectType({
          name: 'StakingUnstakingStartType',
          fields: {
            block: {
              type: GraphQLString,
              description: 'Block number of start unstaking',
            },
            date: {
              type: dateTimeType,
              description: 'Date of start unstaking',
            },
          },
        }),
      ),
      resolve: ({ unstakingStartBlock, unstakingStartDate }) => ({
        block: unstakingStartBlock,
        date: unstakingStartDate,
      }),
    },
    apr: {
      type: GraphQLNonNull(
        new GraphQLObjectType({
          name: 'StakingAprType',
          fields: {
            block: {
              type: GraphQLNonNull(GraphQLString),
              description: 'APR per block',
            },
            day: {
              type: GraphQLNonNull(GraphQLString),
              description: 'APR per day',
            },
            week: {
              type: GraphQLNonNull(GraphQLString),
              description: 'APR per week',
            },
            month: {
              type: GraphQLNonNull(GraphQLString),
              description: 'APR per month',
            },
            year: {
              type: GraphQLNonNull(GraphQLString),
              description: 'APR per year',
            },
          },
        }),
      ),
      resolve: ({ aprBlock, aprDay, aprWeek, aprMonth, aprYear }) => ({
        block: aprBlock,
        day: aprDay,
        week: aprWeek,
        month: aprMonth,
        year: aprYear,
      }),
    },
    userList: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(stakingUserType))),
      args: {
        filter: {
          type: new GraphQLInputObjectType({
            name: 'StakingUserListFilterInputType',
            fields: {
              address: {
                type: GraphQLList(GraphQLNonNull(addressScalar)),
                description: 'List of target wallets',
              },
            },
          }),
        },
      },
      resolve: async (staking, { filter }) => {
        const { address } = filter ?? { address: [] };

        if (address.length == 0) return [];

        const stakingUsers = await Promise.all<StakingUserSource | { user: undefined }>(
          address.map(async (address: string) => ({
            staking,
            user: await container.model.stakingUserService.find(staking, address),
          })),
        );

        return stakingUsers.filter(({ user }) => user !== undefined);
      },
    },
    rewardHistory: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(rewardHistoryType))),
      resolve: (staking) => container.model.stakingRewardHistory.find(staking),
    },
  },
});

export const stakingPayload = new GraphQLObjectType({
  name: 'StakingPayload',
  fields: {
    data: {
      type: stakingType,
    },
    error: {
      type: errorType,
    },
  },
});
