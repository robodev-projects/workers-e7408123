export abstract class KVStoreProvider<GenericValue extends NonNullable<any>> {
  public abstract namespace: string;
  public abstract set<Value extends GenericValue>(
    key: string,
    prefix: string,
    value: Value,
    /**
     * Time to live in seconds
     */
    ttl?: number,
  ): Promise<boolean>;
  public abstract has(key: string, prefix: string): Promise<boolean>;
  public abstract get<Value extends GenericValue>(key: string, prefix: string): Promise<Value | null>;
  public abstract list<Value extends GenericValue>(prefix: string): AsyncGenerator<[string, Value]>;
  public abstract delete(key: string, prefix: string): Promise<boolean>;
  public abstract clear(prefix: string): Promise<boolean>;
}
