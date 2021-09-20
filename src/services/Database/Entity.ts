import { Factory } from '@services/Container';
import dayjs from 'dayjs';
import Knex, { DbRecord, QueryBuilder, ResolveTableType } from 'knex';

export function tableFactory<T>(table: string, schema: string = 'public') {
  return (connect: Knex) => () => {
    return connect<T, T[]>(table).withSchema(schema);
  };
}

export function cached<T extends { updatedAt: Date }>(
  table: Factory<QueryBuilder<T, T[]>>,
  ttl: number,
) {
  return async (
    where: DbRecord<ResolveTableType<T>>,
    resolve: (cached: T | undefined) => Promise<T | undefined>,
  ) => {
    const cached = await table().where(where).first();
    if (cached) {
      if (cached.updatedAt >= dayjs().subtract(ttl, 'seconds').toDate()) return cached;

      const updatedCount = await table()
        .update({
          ...cached,
          updatedAt: new Date(),
        } as any)
        .where({
          ...where,
          updatedAt: cached.updatedAt,
        });
      if (updatedCount === 0) return cached;
    }

    try {
      const entity = await resolve(cached as T | undefined);
      if (entity !== undefined) {
        if (cached) {
          await table()
            .update(entity as any)
            .where(where);
        } else {
          await table().insert(entity as any);
        }
      }

      return entity;
    } catch (error) {
      throw { error, cached };
    }
  };
}
