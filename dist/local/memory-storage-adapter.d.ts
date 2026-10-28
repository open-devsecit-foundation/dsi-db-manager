/**
 * db-manager - In-Memory Local Storage Adapter
 */
import { ILocalAdapter } from './local-adapter.interface';
import { DbRecord, QueryFilter, QueryOptions } from '../core/types';
export declare function matchesFilter(record: Record<string, any>, filter?: QueryFilter): boolean;
export declare function sortAndPaginate<T>(records: DbRecord<T>[], options?: QueryOptions): DbRecord<T>[];
export declare class MemoryStorageAdapter implements ILocalAdapter {
    name: string;
    private stores;
    init(): Promise<void>;
    close(): Promise<void>;
    private getStore;
    get<T = any>(collection: string, id: string): Promise<DbRecord<T> | null>;
    find<T = any>(collection: string, filter?: QueryFilter, options?: QueryOptions): Promise<DbRecord<T>[]>;
    put<T = any>(collection: string, record: DbRecord<T>): Promise<DbRecord<T>>;
    putBatch<T = any>(collection: string, records: DbRecord<T>[]): Promise<DbRecord<T>[]>;
    delete(collection: string, id: string, softDelete?: boolean): Promise<boolean>;
    clear(collection: string): Promise<void>;
    listCollections(): Promise<string[]>;
}
//# sourceMappingURL=memory-storage-adapter.d.ts.map