import { Factory } from '@services/Container';
import { tableFactory } from '@services/Database/Entity';
import { Logger } from '@services/Logger/Logger';
import Knex from 'knex';

export interface Migration {
  name: string;
  createdAt: Date;
}

const tableName = 'migration';

export const migrationTableFactory = tableFactory<Migration>(tableName);

export type MigrationTable = ReturnType<ReturnType<typeof migrationTableFactory>>;

export async function migrate(logger: Logger, database: Knex) {
  const schema = database.schema;
  if (await schema.hasTable(tableName)) return;

  logger.info('Migrations init');
  return schema.createTable(tableName, (table) => {
    table.string('name', 512).notNullable().primary('migration_pkey');
    table.dateTime('createdAt').notNullable();
  });
}
