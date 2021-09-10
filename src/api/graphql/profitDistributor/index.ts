import { ProfitDistributor } from '@models/ProfitDistributor/Entity';
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
import { tokenType } from '../token';
import { ProfitDistributorUserSource, profitDistributorUserType } from './user';

export const periodStart = ({ periodFinish, rewardsDuration }: ProfitDistributor) => {
  if (periodFinish === '0') return '0';

  return new BigNumber(periodFinish).minus(rewardsDuration).toString(10);
};

export const rewardForDuration = ({ blockPoolRate, rewardsDuration }: ProfitDistributor) => {
  return new BigNumber(blockPoolRate).multipliedBy(rewardsDuration).toString(10);
};

export const earned = (staking: ProfitDistributor, { currentBlockNumber }: Request) => {
  const start = periodStart(staking);
  if (start === '0') return '0';

  return new BigNumber(currentBlockNumber)
    .minus(start)
    .multipliedBy(staking.blockPoolRate)
    .toString(10);
};

export const profitDistributorType = new GraphQLObjectType<ProfitDistributor, Request>({
  name: 'ProfitDistributorType',
  fields: {
    address: {
      type: GraphQLNonNull(addressScalar),
      description: 'Staking contract address',
    },
    stakingToken: {
      type: tokenType,
      description: 'Staking token',
      resolve: ({ stakingToken }, args, { currentNetwork }) => {
        return container.model.tokenService().find(currentNetwork, stakingToken);
      },
    },
    stakingTokenDecimals: {
      type: GraphQLNonNull(GraphQLInt),
      description: 'Staking token decimals',
    },
    rewardToken: {
      type: tokenType,
      description: 'Reward token address',
      resolve: ({ rewardToken }, args, { currentNetwork }) => {
        return container.model.tokenService().find(currentNetwork, rewardToken);
      },
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
    lockPeriod: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Block number of lock period',
    },
    lockPeriodDate: {
      type: GraphQLNonNull(dateTimeType),
      description: 'Date of lock period',
    },
    rewardsDuration: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Rewards duration',
    },
    rewardForDuration: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Reward for duration',
      resolve: (staking: ProfitDistributor) => {
        return rewardForDuration(staking);
      },
    },
    rewardForDurationFloat: {
      type: GraphQLNonNull(GraphQLString),
      description: 'Reward for duration normalize',
      resolve: (staking: ProfitDistributor) => {
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
          name: 'ProfitDistributorPoolRateType',
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
    apr: {
      type: GraphQLNonNull(
        new GraphQLObjectType({
          name: 'ProfitDistributorAprType',
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
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(profitDistributorUserType))),
      args: {
        filter: {
          type: new GraphQLInputObjectType({
            name: 'ProfitDistributorUserListFilterInputType',
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

        const stakingUsers = await Promise.all<ProfitDistributorUserSource & { user: undefined }>(
          address.map(async (address: string) => ({
            staking,
            user: await container.model.profitDistributorUserService().find(staking, address),
          })),
        );

        return stakingUsers.filter(({ user }) => user !== undefined);
      },
    },
  },
});

export const profitDistributorPayload = new GraphQLObjectType({
  name: 'ProfitDistributorPayload',
  fields: {
    data: {
      type: profitDistributorType,
    },
    error: {
      type: errorType,
    },
  },
});
