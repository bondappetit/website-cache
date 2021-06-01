import { tableName } from '@models/Swopfi/Entity';
import { SchemaBuilder } from 'knex';

export default (schema: SchemaBuilder) => {
  return schema.createTable(tableName, (table) => {
    table.string('address', 64).notNullable();
    table.integer('network').notNullable();
    table.string('token0Address', 64).notNullable();
    table.string('token0Balance', 512).notNullable();
    table.string('token1Address', 64).notNullable();
    table.string('token1Balance', 512).notNullable();
    table.string('incomeUSD', 512).notNullable();
    table.string('totalLiquidityUSD', 512).notNullable();
    table.string('dailyFeesUSD', 512).notNullable();
    table.string('dailyVolumeUSD', 512).notNullable();
    table.string('dailyTxCount', 512).notNullable();
    table.string('aprYear', 512).notNullable();
    table.dateTime('updatedAt').notNullable();
    table.primary(['address', 'network'], `${tableName}_pkey`);
  });
};
