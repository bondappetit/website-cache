import { tableName } from '@models/Staking/Entity';
import { SchemaBuilder } from 'knex';

export default (schema: SchemaBuilder) => {
  return schema.createTable(tableName, (table) => {
    table.string('address', 42).notNullable();
    table.integer('network').notNullable();
    table.string('rewardToken', 512).notNullable();
    table.integer('rewardTokenDecimals').notNullable();
    table.string('stakingToken', 512).notNullable();
    table.integer('stakingTokenDecimals').notNullable();
    table.string('totalSupply', 512).notNullable();
    table.string('blockPoolRate', 512).notNullable();
    table.string('dailyPoolRate', 512).notNullable();
    table.string('stakingEndBlock', 512).nullable();
    table.dateTime('stakingEndDate').nullable();
    table.string('unstakingStartBlock', 512).nullable();
    table.dateTime('unstakingStartDate').nullable();
    table.string('roi', 512).notNullable();
    table.dateTime('updatedAt').notNullable();
    table.primary(['address', 'network'], `${tableName}_pkey`);
  });
};
