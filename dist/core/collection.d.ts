/**
 * db-manager - Type-Safe Collection Facade
 */
import { DbRecord, QueryFilter, QueryOptions, SyncMetadata } from './types';
import { ILocalAdapter } from '../local/local-adapter.interface';
import { SyncQueue } from '../sync/sync-queue';
import { SyncEngine } from '../sync/sync-engine';
export declare class Collection<T = Record<string, any>> {
    readonly name: string;
    private local;
    private queue;
    private syncEngine?;
    constructor(name: string, local: ILocalAdapter, queue: SyncQueue, syncEngine?: SyncEngine);
    /**
     * Inserts a record. Writes immediately to local storage and enqueues sync mutation.
     */
    insert(data: Omit<T, keyof SyncMetadata> & Partial<SyncMetadata>): Promise<DbRecord<T>>;
    /**
     * Retrieves a record by its unique ID from local storage.
     */
    findById(id: string): Promise<DbRecord<T> | null>;
    /**
     * Finds records matching the filter criteria. Instant local execution.
     */
    find(filter?: QueryFilter, options?: QueryOptions): Promise<DbRecord<T>[]>;
    /**
     * Finds the first record matching filter criteria.
     */
    findOne(filter?: QueryFilter): Promise<DbRecord<T> | null>;
    /**
     * Updates an existing record. Writes immediately to local storage and enqueues sync mutation.
     */
    update(id: string, changes: Partial<Omit<T, keyof SyncMetadata>>): Promise<DbRecord<T>>;
    /**
     * Deletes a record. Defaults to soft-delete tombstone to safely propagate across offline sync.
     */
    delete(id: string, options?: {
        hard?: boolean;
    }): Promise<boolean>;
    /**
     * Returns total record count matching criteria.
     */
    count(filter?: QueryFilter): Promise<number>;
}
//# sourceMappingURL=collection.d.ts.map