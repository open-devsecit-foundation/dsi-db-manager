"use strict";
/**
 * db-manager - Persistent Sync Mutation Queue
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncQueue = void 0;
const SYNC_QUEUE_COLLECTION = 'sync_queue';
function generateQueueId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'q_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
}
class SyncQueue {
    local;
    constructor(local) {
        this.local = local;
    }
    /**
     * Enqueues a local mutation to be synchronized to the remote backend
     */
    async enqueue(collection, action, recordId, data, timestamp = Date.now()) {
        const item = {
            id: generateQueueId(),
            collection,
            action,
            recordId,
            data,
            timestamp,
            retryCount: 0,
        };
        const record = {
            ...item,
            _id: item.id,
            _version: 1,
            _createdAt: timestamp,
            _updatedAt: timestamp,
            _deleted: false,
            _synced: false,
        };
        await this.local.put(SYNC_QUEUE_COLLECTION, record);
        return item;
    }
    /**
     * Retrieves pending items sorted by timestamp (FIFO)
     */
    async getAll() {
        const records = await this.local.find(SYNC_QUEUE_COLLECTION, {}, { sort: { timestamp: 'asc' }, includeDeleted: false });
        return records.map((r) => ({
            id: r.id || r._id,
            collection: r.collection,
            action: r.action,
            recordId: r.recordId,
            data: r.data,
            timestamp: r.timestamp,
            retryCount: r.retryCount || 0,
            lastError: r.lastError,
        }));
    }
    /**
     * Dequeues (removes) a processed item
     */
    async dequeue(id) {
        return await this.local.delete(SYNC_QUEUE_COLLECTION, id, false); // hard delete from queue
    }
    /**
     * Updates an item's retry status upon failure
     */
    async recordFailure(id, errorMsg) {
        const rec = await this.local.get(SYNC_QUEUE_COLLECTION, id);
        if (!rec)
            return;
        rec.retryCount = (rec.retryCount || 0) + 1;
        rec.lastError = errorMsg;
        rec._updatedAt = Date.now();
        await this.local.put(SYNC_QUEUE_COLLECTION, rec);
    }
    async count() {
        const all = await this.getAll();
        return all.length;
    }
    async clear() {
        await this.local.clear(SYNC_QUEUE_COLLECTION);
    }
}
exports.SyncQueue = SyncQueue;
//# sourceMappingURL=sync-queue.js.map