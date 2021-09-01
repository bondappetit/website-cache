import { tableName as profitDistributorTableName } from '@models/ProfitDistributor/Entity';
import { tableName } from '@models/ProfitDistributor/User/Entity';
import { SchemaBuilder } from 'knex';

export default (schema: SchemaBuilder) => {
  return schema.createTable(tableName, (table) => {
    table.string('distributor', 42).notNullable();
    table.integer('network').notNullable();
    table.string('address', 42).notNullable();
    table.string('balance', 512).notNullable().defaultTo('0');
    table.string('earned', 512).notNullable().defaultTo('0');
    table.boolean('locked').notNullable().defaultTo(false);
    table.string('stakeAt', 64).nullable();
    table.dateTime('stakeAtDate').nullable();
    table.string('nextLock', 64).nullable();
    table.dateTime('nextLockDate').nullable();
    table.string('nextUnlock', 64).nullable();
    table.dateTime('nextUnlockDate').nullable();
    table.dateTime('updatedAt').notNullable();
    table.primary(['distributor', 'network', 'address'], `${tableName}_pkey`);
    table
      .foreign(['distributor', 'network'])
      .references(['address', 'network'])
      .inTable(profitDistributorTableName)
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
  });
};
