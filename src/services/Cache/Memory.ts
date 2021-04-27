import { Key, Value, Cache } from './Cache';

export interface Item<T extends Value> {
  value: T;
  ttl: Date;
}

export class MemoryCache implements Cache {
  protected readonly data: Map<Key, Item<Value>> = new Map();

  set(key: Key, value: Value, ttl: Date) {
    this.data.set(key, {
      value,
      ttl,
    });
  }

  get<T extends Value>(key: Key, def: T): T {
    const value = this.data.get(key);
    if (!value || value.ttl.getTime() < Date.now()) return def;

    return value.value as T;
  }

  del(key: Key) {
    this.data.delete(key);
  }

  async cache<T extends Value>(key: Key, getter: () => Promise<[T, Date]>): Promise<T> {
    const value = this.data.get(key);
    if (!value || value.ttl.getTime() < Date.now()) {
      const [value, ttl] = await getter();
      this.set(key, value, ttl);

      return value;
    }

    return value.value as T;
  }
}
