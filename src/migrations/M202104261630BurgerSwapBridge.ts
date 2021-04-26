import { TransitType, tableName } from '@models/BurgerSwap/Bridge/Entity';
import { SchemaBuilder } from 'knex';

export default (schema: SchemaBuilder) => {
  return schema.createTable(tableName, (table) => {
    table.string('tx', 66).notNullable();
    table.integer('network').notNullable();
    table
      .enum('type', [TransitType.BscWithdraw, TransitType.EthTransit], {
        useNative: true,
        enumName: `${tableName}_type_enum`,
      })
      .notNullable()
      .index();
    table.string('owner', 42).notNullable().index();
    table.dateTime('createdAt').notNullable();
    table.primary(['tx', 'network'], `${tableName}_pkey`);
  });
};
