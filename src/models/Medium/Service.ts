import { Factory } from '@services/Container';
import { Logger } from '@services/Logger/Logger';
import { MediumRssGetter } from '@services/Medium/Rss';
import dayjs from 'dayjs';
import Knex from 'knex';
import { MediumPost, MediumPostTable } from './Entity';

export function factory(
  logger: Factory<Logger>,
  database: Factory<Knex>,
  postTable: Factory<MediumPostTable>,
  mediumRss: MediumRssGetter,
  ttl: number,
) {
  return () => new MediumService(logger, database, postTable, mediumRss, ttl);
}

export class MediumService {
  constructor(
    readonly logger: Factory<Logger> = logger,
    readonly database: Factory<Knex> = database,
    readonly postTable: Factory<MediumPostTable> = postTable,
    readonly mediumRss: MediumRssGetter = mediumRss,
    readonly ttl: number = ttl,
  ) {}

  async findAll(): Promise<MediumPost[]> {
    const cached = await this.postTable();
    const lastUpdate = cached.reduce((max, { updatedAt }) => Math.max(max, updatedAt.getTime()), 0);
    if (new Date(lastUpdate) >= dayjs().subtract(this.ttl, 'seconds').toDate()) return cached;

    const rssPosts = await this.mediumRss();
    const posts = rssPosts.map(
      ({ title, pubDate, link, guid, author, thumbnail, description, content }) => ({
        title,
        pubDate: dayjs(pubDate, 'YYY-MM-DD HH:mm:ss').toDate(),
        link,
        guid,
        author,
        thumbnail,
        description,
        content,
        updatedAt: new Date(),
      }),
    );
    await this.database().transaction(async (trx) => {
      await this.postTable().delete().transacting(trx);
      await Promise.all(posts.map((post) => this.postTable().insert(post).transacting(trx)));
    });

    return posts;
  }
}
