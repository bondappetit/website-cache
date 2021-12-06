import { tableName } from '@models/UniV3/Entity';
import { SchemaBuilder } from 'knex';

export default (schema: SchemaBuilder) => {
  return schema.createTable(tableName, (table) => {
    table.string('address', 64).notNullable();
    table.integer('network').notNullable();
    table.string('token0Address', 64).notNullable();
    table.string('token1Address', 64).notNullable();
    table.string('totalLiquidityUSD', 512).notNullable();
    table.dateTime('updatedAt').notNullable();
    table.primary(['address', 'network'], `${tableName}_pkey`);
  });
};
