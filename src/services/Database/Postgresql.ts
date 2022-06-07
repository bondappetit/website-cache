import knex from 'knex';
import fs from 'fs';

export interface FactoryConfig {
  readonly host?: string;
  readonly port?: number;
  readonly user: string;
  readonly password: string;
  readonly database: string;
  readonly ssl: string;
}

export function factory(config: FactoryConfig) {
  return knex({
    client: 'pg',
    connection: {
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      ssl: config.ssl
        ? {
            ca: fs.readFileSync(config.ssl),
          }
        : undefined,
    },
  });
}
