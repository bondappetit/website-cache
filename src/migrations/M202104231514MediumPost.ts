import { tableName } from '@models/Medium/Entity';
import { SchemaBuilder } from 'knex';

export default (schema: SchemaBuilder) => {
  return schema.createTable(tableName, (table) => {
    table.string('guid', 512).notNullable();
    table.string('title', 512).notNullable();
    table.dateTime('pubDate').notNullable();
    table.string('link', 1024).notNullable();
    table.string('author', 512).notNullable();
    table.string('thumbnail', 1024).notNullable();
    table.text('description').notNullable();
    table.text('content').notNullable();
    table.dateTime('updatedAt').notNullable();
    table.primary(['guid'], `${tableName}_pkey`);
  });
};
