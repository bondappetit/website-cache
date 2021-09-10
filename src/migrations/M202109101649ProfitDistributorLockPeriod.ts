import { tableName } from '@models/ProfitDistributor/Entity';
import { SchemaBuilder } from 'knex';

export default (schema: SchemaBuilder) => {
  return schema.table(tableName, (table) => {
    table.string('lockPeriod', 64).notNullable().defaultTo('0');
    table.dateTime('lockPeriodDate').notNullable().defaultTo('1970-01-01 00:00:00');
  });
};
