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
import { createComplexityLimitRule } from 'graphql-validation-complexity-types';
import { currentNetwork } from './middlewares/currentNetwork';
import { stakingPayload, stakingType } from './graphql/staking';
import { profitDistributorPayload, profitDistributorType } from './graphql/profitDistributor';
import * as BurgerSwapBridge from './graphql/burgerSwap/bridge';
import { walletType, walletPayload } from './graphql/wallet';
import { Staking } from '@models/Staking/Entity';
import BigNumber from 'bignumber.js';
import { mediumPostType } from './graphql/medium';
import { swopfiPairPayload, swopfiPairType } from './graphql/swopfi';
import { SwopfiLiquidityPool } from '@models/Swopfi/Entity';
import dayjs from 'dayjs';
import { uniswapV3PairPayload, uniswapV3PairType } from './graphql/uniswapV3Pair';

export function use({ server, express }: WebServer) {
  const complexityLimit = createComplexityLimitRule(5000, {
    onCost: (cost) => container.logger.info(`Query complexity ${cost}`),
  });

  const apollo = new ApolloServer({
    schema: new GraphQLSchema({
      query: new GraphQLObjectType<undefined, Request>({
        name: 'Query',
        fields: {
          getTVL: {
            description: 'test',
            type: GraphQLNonNull(GraphQLString),
            resolve: () =>
              container.memoryCache.cache('tvl', async () => {
                const mainETHNetwork = container.network(1);
                const mainBSCNetwork = container.network(56);

                const stakingAddresses = {
                  [mainETHNetwork.data.networkId]: [
                    mainETHNetwork.data.contracts.UsdcGovLPStaking.address,
                    mainETHNetwork.data.contracts.UsdcStableLPLockStaking.address,
                    mainETHNetwork.data.contracts.UsdnGovLPStaking.address,
                    mainETHNetwork.data.contracts.UsdtGovLPStaking.address,
                    mainETHNetwork.data.contracts.StableGovLPStaking.address,
                  ],
                  [mainBSCNetwork.data.networkId]: [
                    mainBSCNetwork.data.contracts.BnbGovLPStaking.address,
                  ],
                };
                const stakings = await Promise.all(
                  Object.entries(stakingAddresses).map(([chainId, addresses]) =>
                    Promise.all(
                      addresses.map(async (address: string) =>
                        container.model.stakingService.find(
                          container.network(parseInt(chainId, 10)),
                          address,
                        ),
                      ),
                    ),
                  ),
                );
                const stakingTVL = await ([] as Array<Staking | undefined>)
                  .concat(...stakings)
                  .reduce(async (sum: Promise<BigNumber>, staking: Staking | undefined) => {
                    if (staking === undefined) return sum;

                    const pair = await container.model.uniswapLPService.find(
                      container.network(staking.network),
                      staking.stakingToken,
                    );
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
                  }, Promise.resolve(new BigNumber(0)));
                const swopfiAddresses = ['3PAgYAV4jYJ7BF8LCVNU9tyWCBtQaqeLQH4'];
                const swopfis = await Promise.all(
                  swopfiAddresses.map((address: string) =>
                    container.model.swopfiLPService.find(0, address),
                  ),
                );
                const swopfiTVL = await ([] as Array<SwopfiLiquidityPool | undefined>)
                  .concat(...swopfis)
                  .reduce(
                    async (sum: Promise<BigNumber>, pool: SwopfiLiquidityPool | undefined) => {
                      if (pool === undefined) return sum;

                      return new BigNumber(pool.totalLiquidityUSD).div('1000000').plus(await sum);
                    },
                    Promise.resolve(new BigNumber(0)),
                  );
                const uniV3Addresses = [
                  mainETHNetwork.data.contracts.UsdcStableUniswapV3Pool.address,
                ];
                const uniV3TVL = await uniV3Addresses.reduce(async (prev, pool) => {
                  const sum = await prev;
                  const poolStat = await container.model.uniV3LPService.find(
                    container.network(1),
                    pool,
                  );
                  if (!poolStat) return sum;

                  return sum.plus(poolStat.totalLiquidityUSD);
                }, Promise.resolve(new BigNumber(0)));

                return [
                  new BigNumber(stakingTVL).plus(swopfiTVL).plus(uniV3TVL).toFixed(2),
                  dayjs().add(1, 'minutes').toDate(),
                ];
              }),
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
              const token = await container.model.tokenService.find(currentNetwork, address);

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
                address.map((address: string) =>
                  container.model.tokenService.find(currentNetwork, address),
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
              const pair = await container.model.uniswapLPService.find(currentNetwork, address);

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
                address.map((address: string) =>
                  container.model.uniswapLPService.find(currentNetwork, address),
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
              const staking = await container.model.stakingService.find(currentNetwork, address);

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
                address.map((address: string) =>
                  container.model.stakingService.find(currentNetwork, address),
                ),
              );

              return stakings.filter((staking) => staking !== undefined);
            },
          },
          profitDistributor: {
            type: GraphQLNonNull(profitDistributorPayload),
            args: {
              filter: {
                type: GraphQLNonNull(
                  new GraphQLInputObjectType({
                    name: 'ProfitDistributorQueryFilterInputType',
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
              const staking = await container.model.profitDistributorService.find(
                currentNetwork,
                address,
              );

              return staking ? { data: staking } : { error: 'Staking not found' };
            },
          },
          profitDistributorList: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(profitDistributorType))),
            args: {
              filter: {
                type: new GraphQLInputObjectType({
                  name: 'ProfitDistributorListQueryFilterInputType',
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
                address.map((address: string) =>
                  container.model.profitDistributorService.find(currentNetwork, address),
                ),
              );

              return stakings.filter((staking) => staking !== undefined);
            },
          },
          mediumPostList: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(mediumPostType))),
            resolve: () => {
              return container.model.mediumPostService.findAll();
            },
          },
          wallet: {
            type: GraphQLNonNull(walletPayload),
            args: {
              filter: {
                type: GraphQLNonNull(
                  new GraphQLInputObjectType({
                    name: 'WalletQueryFilterInputType',
                    fields: {
                      address: {
                        type: GraphQLNonNull(addressScalar),
                        description: 'Target wallet address',
                      },
                    },
                  }),
                ),
              },
            },
            resolve: async (root, { filter: { address } }, { currentNetwork }) => {
              const wallet = await container.model.walletService.find(currentNetwork, address);

              return wallet ? { data: wallet } : { error: 'Wallet not found' };
            },
          },
          walletList: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(walletType))),
            args: {
              filter: {
                type: new GraphQLInputObjectType({
                  name: 'WalletListQueryFilterInputType',
                  fields: {
                    address: {
                      type: GraphQLList(GraphQLNonNull(addressScalar)),
                      description: 'List of target wallet addresses',
                    },
                  },
                }),
              },
            },
            resolve: async (root, { filter }, { currentNetwork }) => {
              const { address } = filter ?? { address: [] };

              if (address.length == 0) return [];

              const wallets = await Promise.all(
                address.map((address: string) =>
                  container.model.walletService.find(currentNetwork, address),
                ),
              );

              return wallets.filter((wallet) => wallet !== undefined);
            },
          },
          swopfiPair: {
            type: GraphQLNonNull(swopfiPairPayload),
            args: {
              filter: {
                type: GraphQLNonNull(
                  new GraphQLInputObjectType({
                    name: 'SwopfiPairQueryFilterInputType',
                    fields: {
                      address: {
                        type: GraphQLNonNull(GraphQLString),
                        description: 'Target pair address',
                      },
                    },
                  }),
                ),
              },
            },
            resolve: async (root, { filter: { address } }) => {
              const pair = await container.model.swopfiLPService.find(1, address);

              return pair ? { data: pair } : { error: 'Pair not found' };
            },
          },
          swopfiPairList: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(swopfiPairType))),
            args: {
              filter: {
                type: new GraphQLInputObjectType({
                  name: 'SwopfiPairListQueryFilterInputType',
                  fields: {
                    address: {
                      type: GraphQLList(GraphQLNonNull(GraphQLString)),
                      description: 'List of target pair addresses',
                    },
                  },
                }),
              },
            },
            resolve: async (root, { filter }) => {
              const { address } = filter ?? { address: [] };

              if (address.length == 0) return [];

              const pairs = await Promise.all(
                address.map((address: string) => container.model.swopfiLPService.find(1, address)),
              );

              return pairs.filter((pair) => pair !== undefined);
            },
          },
          uniswapV3Pair: {
            type: GraphQLNonNull(uniswapV3PairPayload),
            args: {
              filter: {
                type: GraphQLNonNull(
                  new GraphQLInputObjectType({
                    name: 'UniswapV3PairQueryFilterInputType',
                    fields: {
                      address: {
                        type: GraphQLNonNull(GraphQLString),
                        description: 'Target pair address',
                      },
                    },
                  }),
                ),
              },
            },
            resolve: async (root, { filter: { address } }, { currentNetwork }) => {
              const pair = await container.model.uniV3LPService.find(currentNetwork, address);

              return pair ? { data: pair } : { error: 'Pair not found' };
            },
          },
          uniswapV3PairList: {
            type: GraphQLNonNull(GraphQLList(GraphQLNonNull(uniswapV3PairType))),
            args: {
              filter: {
                type: new GraphQLInputObjectType({
                  name: 'UniswapV3PairListQueryFilterInputType',
                  fields: {
                    address: {
                      type: GraphQLList(GraphQLNonNull(GraphQLString)),
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
                address.map((address: string) =>
                  container.model.uniswapLPService.find(currentNetwork, address),
                ),
              );

              return pairs.filter((pair) => pair !== undefined);
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
              return container.model.burgerSwapTransitService.add(
                currentNetwork,
                input.tx,
                input.type,
                input.owner,
              );
            },
          },
        },
      }),
    }),
    subscriptions: '/api',
    playground: true,
    context: ({ req }) => req,
    validationRules: [complexityLimit],
  });
  apollo.installSubscriptionHandlers(server);
  express.use('/', [currentNetwork, json(), apollo.getMiddleware({ path: '/' })]);
}
