import { Staking } from '@models/Staking/Entity';
import { Request } from 'express';
import BigNumber from 'bignumber.js';
import container from '@container';
import {
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql';
import { addressScalar, dateTimeType, errorType } from '../types';
import { StakingUserSource, stakingUserType } from './user';

export const stakingType = new GraphQLObjectType<Staking, Request>({
  name: 'StakingType',
  fields: {
    address: {
      type: GraphQLNonNull(addressScalar),
      description: 'Staking contract address',
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
          .toString();
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
                return new BigNumber(block).div(new BigNumber(10).pow(decimals)).toString();
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
                return new BigNumber(daily).div(new BigNumber(10).pow(decimals)).toString();
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

        const stakingUsers = await Promise.all<StakingUserSource & { user: undefined }>(
          address.map(async (address: string) => ({
            staking,
            user: await container.model.stakingUserService().find(staking, address),
          })),
        );

        return stakingUsers.filter(({ user }) => user !== undefined);
      },
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
