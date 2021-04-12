import { Staking } from '@models/Staking/Entity';
import BigNumber from 'bignumber.js';
import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { addressScalar, dateTimeType, errorType } from '../types';

export const stakingType = new GraphQLObjectType<Staking>({
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
    roi: {
      type: GraphQLString,
      description: 'Return on investment',
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
