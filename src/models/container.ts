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

export class ModelContainer extends Container<typeof AppContainer> {
  readonly migrationTable = MigrationEntity.migrationTableFactory(this.parent.database);

  readonly migrationService = singleton(
    MigrationService.factory(
      this.parent.logger,
      this.parent.database,
      this.migrationTable,
      resolve(__dirname, '../migrations'),
    ),
  );

  readonly tokenTable = TokenEntity.tokenTableFactory(this.parent.database);

  readonly tokenService = TokenService.factory(
    this.parent.logger,
    this.tokenTable,
    this.parent.ethereum,
    15,
  );

  readonly uniswapLPTable = UniswapLiquidityPoolEntity.uniswapLiquidityPoolTableFactory(
    this.parent.database,
  );

  readonly uniswapLPService = UniswapLiquidityPoolService.factory(
    this.parent.logger,
    this.uniswapLPTable,
    15,
  );

  readonly stakingTable = StakingEntity.stakingTableFactory(this.parent.database);

  readonly stakingService = StakingService.factory(
    this.parent.logger,
    this.stakingTable,
    this.parent.ethereum,
    this.tokenService,
    this.uniswapLPService,
    30,
  );
}
