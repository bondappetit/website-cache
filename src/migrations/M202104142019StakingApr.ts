import { tableName } from '@models/Staking/Entity';
import { SchemaBuilder } from 'knex';

export default (schema: SchemaBuilder) => {
  return schema.table(tableName, (table) => {
    table.dropColumn('roi');
    table.string('aprBlock', 512).notNullable().defaultTo(0);
    table.string('aprDay', 512).notNullable().defaultTo(0);
    table.string('aprWeek', 512).notNullable().defaultTo(0);
    table.string('aprMonth', 512).notNullable().defaultTo(0);
    table.string('aprYear', 512).notNullable().defaultTo(0);
  });
};
