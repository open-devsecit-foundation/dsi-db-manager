/**
 * db-manager - Persistent Sync Mutation Queue
 */
import { ILocalAdapter } from '../local/local-adapter.interface';
import { SyncQueueItem, SyncAction } from '../core/types';
export declare class SyncQueue {
    private local;
    constructor(local: ILocalAdapter);
    /**
     * Enqueues a local mutation to be synchronized to the remote backend
     */
    enqueue(collection: string, action: SyncAction, recordId: string, data?: any, timestamp?: number): Promise<SyncQueueItem>;
    /**
     * Retrieves pending items sorted by timestamp (FIFO)
     */
    getAll(): Promise<SyncQueueItem[]>;
    /**
     * Dequeues (removes) a processed item
     */
    dequeue(id: string): Promise<boolean>;
    /**
     * Updates an item's retry status upon failure
     */
    recordFailure(id: string, errorMsg: string): Promise<void>;
    count(): Promise<number>;
    clear(): Promise<void>;
}
//# sourceMappingURL=sync-queue.d.ts.map