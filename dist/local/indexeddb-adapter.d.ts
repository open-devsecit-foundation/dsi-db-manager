/**
 * db-manager - IndexedDB Local Storage Adapter
 * Designed for Browser & Electron Renderer environments.
 */
import { ILocalAdapter } from './local-adapter.interface';
import { DbRecord, QueryFilter, QueryOptions } from '../core/types';
export declare class IndexedDbAdapter implements ILocalAdapter {
    name: string;
    private dbName;
    private version;
    private db;
    private knownStores;
    constructor(options?: {
        dbName?: string;
        version?: number;
    });
    init(): Promise<void>;
    close(): Promise<void>;
    private ensureStore;
    get<T = any>(collection: string, id: string): Promise<DbRecord<T> | null>;
    find<T = any>(collection: string, filter?: QueryFilter, options?: QueryOptions): Promise<DbRecord<T>[]>;
    put<T = any>(collection: string, record: DbRecord<T>): Promise<DbRecord<T>>;
    putBatch<T = any>(collection: string, records: DbRecord<T>[]): Promise<DbRecord<T>[]>;
    delete(collection: string, id: string, softDelete?: boolean): Promise<boolean>;
    clear(collection: string): Promise<void>;
    listCollections(): Promise<string[]>;
}
//# sourceMappingURL=indexeddb-adapter.d.ts.map