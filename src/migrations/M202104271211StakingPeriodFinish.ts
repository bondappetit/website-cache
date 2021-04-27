import { tableName } from '@models/Staking/Entity';
import { SchemaBuilder } from 'knex';

export default (schema: SchemaBuilder) => {
  return schema.table(tableName, (table) => {
    table.string('periodFinish', 64).notNullable().defaultTo(0);
    table.string('rewardsDuration', 64).notNullable().defaultTo(0);
  });
};
