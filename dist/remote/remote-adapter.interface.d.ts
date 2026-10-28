/**
 * db-manager - Remote Adapter Interface
 */
import { BackendType, DbRecord, QueryFilter, QueryOptions } from '../core/types';
export interface IRemoteAdapter {
    name: string;
    type: BackendType;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    ping(): Promise<boolean>;
    get<T = any>(collection: string, id: string): Promise<DbRecord<T> | null>;
    find<T = any>(collection: string, filter?: QueryFilter, options?: QueryOptions): Promise<DbRecord<T>[]>;
    insert<T = any>(collection: string, record: DbRecord<T>): Promise<DbRecord<T>>;
    update<T = any>(collection: string, id: string, record: Partial<DbRecord<T>>): Promise<DbRecord<T>>;
    delete(collection: string, id: string): Promise<boolean>;
    fetchChangesSince?<T = any>(collection: string, timestampMs: number): Promise<DbRecord<T>[]>;
}
//# sourceMappingURL=remote-adapter.interface.d.ts.map