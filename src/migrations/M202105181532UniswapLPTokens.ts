import { tableName } from '@models/UniswapLiquidityPool/Entity';
import { SchemaBuilder } from 'knex';

export default (schema: SchemaBuilder) => {
  return schema.table(tableName, (table) => {
    table
      .string('token0Address', 42)
      .notNullable()
      .defaultTo('0x0000000000000000000000000000000000000000');
    table
      .string('token1Address', 42)
      .notNullable()
      .defaultTo('0x0000000000000000000000000000000000000000');
    table.integer('token0Decimals').notNullable().defaultTo(18);
    table.integer('token1Decimals').notNullable().defaultTo(18);
    table.string('token0Reserve', 512).notNullable().defaultTo('0');
    table.string('token1Reserve', 512).notNullable().defaultTo('0');
  });
};
