import { WebServer } from '@services/WebServer/Express';
import { Request } from 'express';
import { ApolloServer } from 'apollo-server-express';
import { json } from 'body-parser';
import container from '@container';
import {
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from 'graphql';
import { tokenPayload, tokenType } from './graphql/token';
import { uniswapPairPayload, uniswapPairType } from './graphql/uniswapPair';
import { addressScalar } from './graphql/types';
import { currentNetwork } from './middlewares/currentNetwork';
import { stakingPayload, stakingType } from './graphql/staking';
import * as BurgerSwapBridge from './graphql/burgerSwap/bridge';
import { Staking } from '@models/Staking/Entity';
import BigNumber from 'bignumber.js';
import { mediumPostType } from './graphql/medium';

export function use({ server, express }: WebServer) {
  const apollo = new ApolloServer({
    schema: new GraphQLSchema({
      query: new GraphQLObjectType<undefined, Request>({
        name: 'Query',
        fields: {
          getTVL: {
            type: GraphQLNonNull(GraphQLString),
            resolve: async (root, args, { currentNetwork }) => {
              const stakingAddresses = [
                currentNetwork.data.contracts.UsdcGovLPStaking.address,
                currentNetwork.data.contracts.UsdcStableLPLockStaking.address,
                currentNetwork.data.contracts.UsdnGovLPStaking.address,
              ];
              const stakings = await Promise.all(
                stakingAddresses.map(async (address: string) =>
                  container.model.stakingService().find(currentNetwork, address),
                ),
              );
              const tvl = await stakings.reduce(
                async (sum: Promise<BigNumber>, staking: Staking | undefined) => {
                  if (staking === undefined) return sum;

                  const pair = await container.model
                    .uniswapLPService()
                    .find(currentNetwork, staking.stakingToken);
                  if (pair === undefined) return sum;

                  return (await sum).plus(
                    new BigNumber(pair.totalLiquidityUSD)
                      .div(pair.totalSupply)
                      .multipliedBy(
                        new BigNumber(staking.totalSupply).div(
                          new BigNumber(10).pow(staking.stakingTokenDecimals),
                        ),
                      ),
                  );
                },
                Promise.resolve(new BigNumber(0)),
              );

              return tvl.toFixed(2);
            },
          },
          token: {
            type: GraphQLNonNull(tokenPayload),
            args: {
              filter: {
                type: GraphQLNonNull(
                  new GraphQLInputObjectType({
                    name: 'TokenQueryFilterInputType',
                    fields: {
                      address: {
                        type: GraphQLNonNull(addressScalar),
                        description: 'Target token address',
                      },
                    },
                  }),
                ),
              },
            },
            resolve: async (root, { filter: { address } }, { currentNetwork }) => {
              const token = await container.model.tokenService().find(currentNetwork, address);

              return token ? { data: token } : { error: 'Token not found' };
            },
          },
          tokenList: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(tokenType))),
            args: {
              filter: {
                type: new GraphQLInputObjectType({
                  name: 'TokenListQueryFilterInputType',
                  fields: {
                    address: {
                      type: GraphQLList(GraphQLNonNull(addressScalar)),
                      description: 'List of target token addresses',
                    },
                  },
                }),
              },
            },
            resolve: async (root, { filter }, { currentNetwork }) => {
              const { address } = filter ?? { address: [] };

              if (address.length == 0) return [];

              const tokens = await Promise.all(
                address.map(async (address: string) =>
                  container.model.tokenService().find(currentNetwork, address),
                ),
              );

              return tokens.filter((token) => token !== undefined);
            },
          },
          uniswapPair: {
            type: GraphQLNonNull(uniswapPairPayload),
            args: {
              filter: {
                type: GraphQLNonNull(
                  new GraphQLInputObjectType({
                    name: 'UniswapPairQueryFilterInputType',
                    fields: {
                      address: {
                        type: GraphQLNonNull(addressScalar),
                        description: 'Target pair address',
                      },
                    },
                  }),
                ),
              },
            },
            resolve: async (root, { filter: { address } }, { currentNetwork }) => {
              const pair = await container.model.uniswapLPService().find(currentNetwork, address);

              return pair ? { data: pair } : { error: 'Pair not found' };
            },
          },
          uniswapPairList: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(uniswapPairType))),
            args: {
              filter: {
                type: new GraphQLInputObjectType({
                  name: 'UniswapPairListQueryFilterInputType',
                  fields: {
                    address: {
                      type: GraphQLList(GraphQLNonNull(addressScalar)),
                      description: 'List of target pair addresses',
                    },
                  },
                }),
              },
            },
            resolve: async (root, { filter }, { currentNetwork }) => {
              const { address } = filter ?? { address: [] };

              if (address.length == 0) return [];

              const pairs = await Promise.all(
                address.map(async (address: string) =>
                  container.model.uniswapLPService().find(currentNetwork, address),
                ),
              );

              return pairs.filter((pair) => pair !== undefined);
            },
          },
          staking: {
            type: GraphQLNonNull(stakingPayload),
            args: {
              filter: {
                type: GraphQLNonNull(
                  new GraphQLInputObjectType({
                    name: 'StakingQueryFilterInputType',
                    fields: {
                      address: {
                        type: GraphQLNonNull(addressScalar),
                        description: 'Target staking contract address',
                      },
                    },
                  }),
                ),
              },
            },
            resolve: async (root, { filter: { address } }, { currentNetwork }) => {
              const staking = await container.model.stakingService().find(currentNetwork, address);

              return staking ? { data: staking } : { error: 'Staking not found' };
            },
          },
          stakingList: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(stakingType))),
            args: {
              filter: {
                type: new GraphQLInputObjectType({
                  name: 'StakingListQueryFilterInputType',
                  fields: {
                    address: {
                      type: GraphQLList(GraphQLNonNull(addressScalar)),
                      description: 'List of target staking contract addresses',
                    },
                  },
                }),
              },
            },
            resolve: async (root, { filter }, { currentNetwork }) => {
              const { address } = filter ?? { address: [] };

              if (address.length == 0) return [];

              const stakings = await Promise.all(
                address.map(async (address: string) =>
                  container.model.stakingService().find(currentNetwork, address),
                ),
              );

              return stakings.filter((staking) => staking !== undefined);
            },
          },
          mediumPostList: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(mediumPostType))),
            resolve: async () => {
              return container.model.mediumPostService().findAll();
            },
          },
        },
      }),
      mutation: new GraphQLObjectType<undefined, Request>({
        name: 'Mutation',
        fields: {
          addBurgerSwapBridgeTransit: {
            type: GraphQLNonNull(BurgerSwapBridge.transitType),
            args: {
              input: {
                type: GraphQLNonNull(BurgerSwapBridge.transitInput),
              },
            },
            resolve: (root, { input }, { currentNetwork }) => {
              return container.model
                .burgerSwapTransitService()
                .add(currentNetwork, input.tx, input.type, input.owner);
            },
          },
        },
      }),
    }),
    subscriptions: '/api',
    playground: true,
    context: ({ req }) => req,
  });
  apollo.installSubscriptionHandlers(server);
  express.use('/', [currentNetwork, json(), apollo.getMiddleware({ path: '/' })]);
}
