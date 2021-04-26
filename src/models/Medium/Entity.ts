import { tableFactory } from '@services/Database/Entity';

export interface MediumPost {
  guid: string;
  title: string;
  pubDate: Date;
  link: string;
  author: string;
  thumbnail: string;
  description: string;
  content: string;
  updatedAt: Date;
}

export const tableName = 'medium_post';

export const mediumPostTableFactory = tableFactory<MediumPost>(tableName);

export type MediumPostTable = ReturnType<ReturnType<typeof mediumPostTableFactory>>;
