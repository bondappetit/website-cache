import { tableName } from '@models/ProfitDistributor/User/Entity';
import { SchemaBuilder } from 'knex';

export default (schema: SchemaBuilder) => {
  return schema.table(tableName, (table) => {
    table.string('penalty', 512).notNullable().defaultTo('0');
  });
};
