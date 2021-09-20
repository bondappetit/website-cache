import { resolve } from 'path';
import { Container, singleton } from '@services/Container';
import AppContainer from '@container';
import * as MigrationEntity from './Migration/Entity';
import * as MigrationService from './Migration/Service';
import * as TokenEntity from './Token/Entity';
import * as TokenService from './Token/Service';
import * as UniswapLiquidityPoolEntity from './UniswapLiquidityPool/Entity';
import * as UniswapLiquidityPoolService from './UniswapLiquidityPool/Service';
import * as StakingEntity from './Staking/Entity';
import * as StakingService from './Staking/Service';
import * as StakingUserEntity from './Staking/User/Entity';
import * as StakingUserService from './Staking/User/Service';
import * as StakingRewardHistory from './Staking/RewardHistory/Service';
import * as ProfitDistributorEntity from './ProfitDistributor/Entity';
import * as ProfitDistributorService from './ProfitDistributor/Service';
import * as ProfitDistributorUserEntity from './ProfitDistributor/User/Entity';
import * as ProfitDistributorUserService from './ProfitDistributor/User/Service';
import * as MediumEntity from './Medium/Entity';
import * as MediumService from './Medium/Service';
import * as BurgerSwapBridgeEntity from './BurgerSwap/Bridge/Entity';
import * as BurgerSwapBridgeService from './BurgerSwap/Bridge/Service';
import * as WalletEntity from './Wallet/Entity';
import * as WalletService from './Wallet/Service';
import * as SwopfiLiquidityPoolEntity from './Swopfi/Entity';
import * as SwopfiLiquidityPoolService from './Swopfi/Service';

export class ModelContainer extends Container<typeof AppContainer> {
  readonly migrationTable = MigrationEntity.migrationTableFactory(this.parent.database);

  readonly migrationService = new MigrationService.MigrationService(
    this.parent.logger,
    this.parent.database,
    this.migrationTable,
    resolve(__dirname, '../migrations'),
    /^M[0-9]+[A-Za-z0-9_]+\.(ts|js)$/i,
  );

  readonly tokenTable = TokenEntity.tokenTableFactory(this.parent.database);

  readonly tokenService = new TokenService.TokenService(
    this.parent.logger,
    this.tokenTable,
    this.parent.ethereum,
    this.parent.priceFeed,
    this.parent.volumeFeed,
    15,
  );

  readonly uniswapLPTable = UniswapLiquidityPoolEntity.uniswapLiquidityPoolTableFactory(
    this.parent.database,
  );

  readonly uniswapLPService = new UniswapLiquidityPoolService.UniswapLiquidityPoolService(
    this.parent.logger,
    this.uniswapLPTable,
    this.parent.ethereum,
    this.tokenService,
    15,
  );

  readonly stakingTable = StakingEntity.stakingTableFactory(this.parent.database);

  readonly stakingService = new StakingService.StakingService(
    this.parent.logger,
    this.stakingTable,
    this.parent.ethereum,
    this.tokenService,
    this.uniswapLPService,
    30,
  );

  readonly stakingUserTable = StakingUserEntity.stakingUserTableFactory(this.parent.database);

  readonly stakingUserService = new StakingUserService.StakingUserService(
    this.parent.logger,
    this.stakingUserTable,
    this.parent.ethereum,
    15,
  );

  readonly stakingRewardHistory = new StakingRewardHistory.RewardHistoryService(
    this.parent.parent.stakingRewardHistory,
  );

  readonly profitDistributorTable = ProfitDistributorEntity.profitDistributorTableFactory(
    this.parent.database,
  );

  readonly profitDistributorService = new ProfitDistributorService.ProfitDistributorService(
    this.parent.logger,
    this.profitDistributorTable,
    this.parent.ethereum,
    this.tokenService,
    30,
  );

  readonly profitDistributorUserTable = ProfitDistributorUserEntity.profitDistributorUserTableFactory(
    this.parent.database,
  );

  readonly profitDistributorUserService = new ProfitDistributorUserService.ProfitDistributorUserService(
    this.parent.logger,
    this.profitDistributorUserTable,
    this.parent.ethereum,
    this.parent.network,
    15,
  );

  readonly mediumPostTable = MediumEntity.mediumPostTableFactory(this.parent.database);

  readonly mediumPostService = new MediumService.MediumService(
    this.parent.database,
    this.mediumPostTable,
    this.parent.medium,
    120,
  );

  readonly burgerSwapTransitTable = BurgerSwapBridgeEntity.transitTableFactory(
    this.parent.database,
  );

  readonly burgerSwapTransitService = new BurgerSwapBridgeService.TransitService(
    this.burgerSwapTransitTable,
  );

  readonly walletTable = WalletEntity.walletTableFactory(this.parent.database);

  readonly walletService = new WalletService.WalletService(
    this.parent.logger,
    this.walletTable,
    this.parent.ethereum,
    15,
  );

  readonly swopfiLPTable = SwopfiLiquidityPoolEntity.swopfiLiquidityPoolTableFactory(
    this.parent.database,
  );

  readonly swopfiLPService = new SwopfiLiquidityPoolService.SwopfiLiquidityPoolService(
    this.parent.logger,
    this.swopfiLPTable,
    60,
  );
}
