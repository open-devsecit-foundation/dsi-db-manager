/**
 * db-manager - File-Based Local Storage Adapter
 * Designed for Node.js, Electron Main Process, and Desktop Environments.
 */
import { ILocalAdapter } from './local-adapter.interface';
import { DbRecord, QueryFilter, QueryOptions } from '../core/types';
export declare class FileStorageAdapter implements ILocalAdapter {
    name: string;
    private dataDir;
    private cache;
    private isNode;
    private fs;
    private path;
    constructor(options?: {
        dataDir?: string;
    });
    private detectEnvironment;
    init(): Promise<void>;
    close(): Promise<void>;
    private flushCollection;
    private flushAll;
    private getStore;
    get<T = any>(collection: string, id: string): Promise<DbRecord<T> | null>;
    find<T = any>(collection: string, filter?: QueryFilter, options?: QueryOptions): Promise<DbRecord<T>[]>;
    put<T = any>(collection: string, record: DbRecord<T>): Promise<DbRecord<T>>;
    putBatch<T = any>(collection: string, records: DbRecord<T>[]): Promise<DbRecord<T>[]>;
    delete(collection: string, id: string, softDelete?: boolean): Promise<boolean>;
    clear(collection: string): Promise<void>;
    listCollections(): Promise<string[]>;
}
//# sourceMappingURL=file-storage-adapter.d.ts.map