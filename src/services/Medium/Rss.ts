import axios from 'axios';

export interface RssPost {
  title: string;
  pubDate: string;
  link: string;
  guid: string;
  author: string;
  thumbnail: string;
  description: string;
  content: string;
  categories: string[];
}

export interface RssPostResponse {
  status: 'ok' | 'error';
  items: RssPost[];
}

export function factory(url: string) {
  return async () => {
    const res = await axios.get<RssPostResponse>(
      `https://api.rss2json.com/v1/api.json?rss_url=${url}`,
    );
    if (res.data.status === 'error') return [];

    return res.data.items;
  };
}

export type MediumRssGetter = ReturnType<typeof factory>;
