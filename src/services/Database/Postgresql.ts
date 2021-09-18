import knex from 'knex';

export interface FactoryConfig {
  readonly host?: string;
  readonly port?: number;
  readonly user: string;
  readonly password: string;
  readonly database: string;
}

export function factory(config: FactoryConfig) {
  return knex({
    client: 'pg',
    connection: config,
  });
}
