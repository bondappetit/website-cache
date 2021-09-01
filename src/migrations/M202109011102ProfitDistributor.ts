import { tableName } from '@models/ProfitDistributor/Entity';
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
    table.string('periodFinish', 64).notNullable().defaultTo(0);
    table.string('rewardsDuration', 64).notNullable().defaultTo(0);
    table.string('aprBlock', 512).notNullable().defaultTo(0);
    table.string('aprDay', 512).notNullable().defaultTo(0);
    table.string('aprWeek', 512).notNullable().defaultTo(0);
    table.string('aprMonth', 512).notNullable().defaultTo(0);
    table.string('aprYear', 512).notNullable().defaultTo(0);
    table.dateTime('updatedAt').notNullable();
    table.primary(['address', 'network'], `${tableName}_pkey`);
  });
};
