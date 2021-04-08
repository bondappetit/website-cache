import { tableName } from '@models/Token/Entity';
import { SchemaBuilder } from 'knex';

export default (schema: SchemaBuilder) => {
  return schema.createTable(tableName, (table) => {
    table.string('address', 42).notNullable();
    table.integer('network').notNullable();
    table.string('name', 512).notNullable();
    table.string('symbol', 512).notNullable();
    table.integer('decimals').notNullable();
    table.string('totalSupply', 512).notNullable();
    table.string('priceUSD', 512).notNullable();
    table.string('dailyVolumeUSD', 512).notNullable();
    table.string('totalLiquidityUSD', 512).notNullable();
    table.dateTime('updatedAt').notNullable();
    table.primary(['address', 'network'], `${tableName}_pkey`);
  });
};
