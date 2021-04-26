import { Factory } from '@services/Container';
import Knex from 'knex';

export function tableFactory<T>(table: string, schema: string = 'public') {
  return (connectFactory: Factory<Knex>) => () => {
    const connect = connectFactory();

    return connect<T, T[]>(table).withSchema(schema);
  };
}