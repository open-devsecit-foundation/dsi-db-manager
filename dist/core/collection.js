"use strict";
/**
 * db-manager - Type-Safe Collection Facade
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collection = void 0;
function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'rec_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
}
class Collection {
    name;
    local;
    queue;
    syncEngine;
    constructor(name, local, queue, syncEngine) {
        this.name = name;
        this.local = local;
        this.queue = queue;
        this.syncEngine = syncEngine;
        if (this.syncEngine) {
            this.syncEngine.registerCollection(name);
        }
    }
    /**
     * Inserts a record. Writes immediately to local storage and enqueues sync mutation.
     */
    async insert(data) {
        const now = Date.now();
        const id = data._id || data.id || generateUUID();
        const record = {
            ...data,
            _id: id,
            _version: (data._version || 0) + 1,
            _createdAt: data._createdAt || now,
            _updatedAt: now,
            _deleted: false,
            _synced: false,
        };
        // 1. Instant local write
        await this.local.put(this.name, record);
        // 2. Durable sync queue registration
        await this.queue.enqueue(this.name, 'insert', id, record, now);
        // 3. Opportunistic background flush if online
        if (this.syncEngine && this.syncEngine.getNetworkMonitor().isOnline()) {
            this.syncEngine.syncNow().catch(() => { });
        }
        return record;
    }
    /**
     * Retrieves a record by its unique ID from local storage.
     */
    async findById(id) {
        const record = await this.local.get(this.name, id);
        if (!record || record._deleted)
            return null;
        return record;
    }
    /**
     * Finds records matching the filter criteria. Instant local execution.
     */
    async find(filter, options) {
        return await this.local.find(this.name, filter, options);
    }
    /**
     * Finds the first record matching filter criteria.
     */
    async findOne(filter) {
        const records = await this.local.find(this.name, filter, { limit: 1 });
        return records.length > 0 ? records[0] : null;
    }
    /**
     * Updates an existing record. Writes immediately to local storage and enqueues sync mutation.
     */
    async update(id, changes) {
        const existing = await this.local.get(this.name, id);
        if (!existing) {
            throw new Error(`[db-manager] Record with id "${id}" not found in collection "${this.name}"`);
        }
        const now = Date.now();
        const updated = {
            ...existing,
            ...changes,
            _id: id,
            _version: (existing._version || 1) + 1,
            _updatedAt: now,
            _synced: false,
        };
        // 1. Instant local write
        await this.local.put(this.name, updated);
        // 2. Durable sync queue registration
        await this.queue.enqueue(this.name, 'update', id, updated, now);
        // 3. Opportunistic background flush
        if (this.syncEngine && this.syncEngine.getNetworkMonitor().isOnline()) {
            this.syncEngine.syncNow().catch(() => { });
        }
        return updated;
    }
    /**
     * Deletes a record. Defaults to soft-delete tombstone to safely propagate across offline sync.
     */
    async delete(id, options) {
        const existing = await this.local.get(this.name, id);
        if (!existing)
            return false;
        const now = Date.now();
        const isHard = options?.hard === true;
        // 1. Local update/delete
        await this.local.delete(this.name, id, !isHard);
        // 2. Durable sync queue registration
        await this.queue.enqueue(this.name, 'delete', id, undefined, now);
        // 3. Opportunistic background flush
        if (this.syncEngine && this.syncEngine.getNetworkMonitor().isOnline()) {
            this.syncEngine.syncNow().catch(() => { });
        }
        return true;
    }
    /**
     * Returns total record count matching criteria.
     */
    async count(filter) {
        const records = await this.local.find(this.name, filter);
        return records.length;
    }
}
exports.Collection = Collection;
//# sourceMappingURL=collection.js.map