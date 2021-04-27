export type Key = string | number;
export type Value = string | number | boolean | null | undefined;

export interface Cache {
  set(key: Key, value: Value, ttl: Date): void;

  get<T extends Value>(key: Key, def: T): T;

  del(key: Key): void;

  cache<T extends Value>(key: Key, getter: () => Promise<[T, Date]>): Promise<T>;
}
