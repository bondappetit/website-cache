import { tableName, StakingTokenType } from '@models/Staking/Entity';
import { SchemaBuilder } from 'knex';

export default (schema: SchemaBuilder) => {
  return schema.table(tableName, (table) => {
    table.string('stakingTokenType', 32).notNullable().defaultTo(StakingTokenType.UniswapLP);
  });
};
