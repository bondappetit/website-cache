import { tableName as stakingTableName } from '@models/Staking/Entity';
import { tableName } from '@models/Staking/User/Entity';
import { SchemaBuilder } from 'knex';

export default (schema: SchemaBuilder) => {
  return schema.createTable(tableName, (table) => {
    table.string('staking', 42).notNullable();
    table.integer('network').notNullable();
    table.string('address', 42).notNullable();
    table.string('balance', 512).notNullable().defaultTo('0');
    table.string('earned', 512).notNullable().defaultTo('0');
    table.dateTime('updatedAt').notNullable();
    table.primary(['staking', 'network', 'address'], `${tableName}_pkey`);
    table
      .foreign(['staking', 'network'])
      .references(['address', 'network'])
      .inTable(stakingTableName)
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
  });
};
