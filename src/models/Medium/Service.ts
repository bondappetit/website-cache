import { Factory } from '@services/Container';
import { MediumRssGetter } from '@services/Medium/Rss';
import dayjs from 'dayjs';
import Knex from 'knex';
import { MediumPost, MediumPostTable } from './Entity';

export class MediumService {
  constructor(
    readonly database: Knex,
    readonly postTable: Factory<MediumPostTable>,
    readonly mediumRss: MediumRssGetter,
    readonly ttl: number,
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
    await this.database.transaction(async (trx) => {
      await this.postTable().delete().transacting(trx);
      await Promise.all(posts.map((post) => this.postTable().insert(post).transacting(trx)));
    });

    return posts;
  }
}
