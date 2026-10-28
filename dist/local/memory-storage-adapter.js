"use strict";
/**
 * db-manager - In-Memory Local Storage Adapter
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryStorageAdapter = void 0;
exports.matchesFilter = matchesFilter;
exports.sortAndPaginate = sortAndPaginate;
function matchesFilter(record, filter) {
    if (!filter || Object.keys(filter).length === 0)
        return true;
    for (const [key, value] of Object.entries(filter)) {
        if (value === undefined)
            continue;
        // Direct equality or null
        if (typeof value !== 'object' || value === null) {
            if (record[key] !== value)
                return false;
            continue;
        }
        // Comparison operators ($gt, $gte, $lt, $lte, $ne, $in, $regex)
        for (const [op, rawOpVal] of Object.entries(value)) {
            const opVal = rawOpVal;
            const recVal = record[key];
            switch (op) {
                case '$eq':
                    if (recVal !== opVal)
                        return false;
                    break;
                case '$ne':
                    if (recVal === opVal)
                        return false;
                    break;
                case '$gt':
                    if (!(recVal > opVal))
                        return false;
                    break;
                case '$gte':
                    if (!(recVal >= opVal))
                        return false;
                    break;
                case '$lt':
                    if (!(recVal < opVal))
                        return false;
                    break;
                case '$lte':
                    if (!(recVal <= opVal))
                        return false;
                    break;
                case '$in':
                    if (!Array.isArray(opVal) || !opVal.includes(recVal))
                        return false;
                    break;
                case '$regex':
                    if (!new RegExp(opVal, 'i').test(String(recVal ?? '')))
                        return false;
                    break;
                default:
                    if (record[key] !== value)
                        return false;
            }
        }
    }
    return true;
}
function sortAndPaginate(records, options) {
    let result = [...records];
    // Sorting
    if (options?.sort) {
        const sortEntries = Object.entries(options.sort);
        result.sort((a, b) => {
            for (const [field, dir] of sortEntries) {
                const valA = a[field];
                const valB = b[field];
                if (valA === valB)
                    continue;
                const multiplier = dir === 'desc' ? -1 : 1;
                if (valA === undefined || valA === null)
                    return 1 * multiplier;
                if (valB === undefined || valB === null)
                    return -1 * multiplier;
                return (valA > valB ? 1 : -1) * multiplier;
            }
            return 0;
        });
    }
    // Pagination
    if (options?.offset && options.offset > 0) {
        result = result.slice(options.offset);
    }
    if (options?.limit && options.limit > 0) {
        result = result.slice(0, options.limit);
    }
    return result;
}
class MemoryStorageAdapter {
    name = 'memory';
    stores = new Map();
    async init() {
        // No-op for in-memory
    }
    async close() {
        this.stores.clear();
    }
    getStore(collection) {
        if (!this.stores.has(collection)) {
            this.stores.set(collection, new Map());
        }
        return this.stores.get(collection);
    }
    async get(collection, id) {
        const store = this.getStore(collection);
        const item = store.get(id);
        if (!item)
            return null;
        return JSON.parse(JSON.stringify(item));
    }
    async find(collection, filter, options) {
        const store = this.getStore(collection);
        const all = Array.from(store.values());
        const filtered = all.filter((rec) => {
            // Exclude soft-deleted records unless explicitly asked
            if (!options?.includeDeleted && rec._deleted) {
                return false;
            }
            return matchesFilter(rec, filter);
        });
        const result = sortAndPaginate(filtered, options);
        return JSON.parse(JSON.stringify(result));
    }
    async put(collection, record) {
        const store = this.getStore(collection);
        const clone = JSON.parse(JSON.stringify(record));
        store.set(record._id, clone);
        return clone;
    }
    async putBatch(collection, records) {
        const store = this.getStore(collection);
        const clonedList = [];
        for (const rec of records) {
            const clone = JSON.parse(JSON.stringify(rec));
            store.set(rec._id, clone);
            clonedList.push(clone);
        }
        return clonedList;
    }
    async delete(collection, id, softDelete = true) {
        const store = this.getStore(collection);
        const existing = store.get(id);
        if (!existing)
            return false;
        if (softDelete) {
            existing._deleted = true;
            existing._updatedAt = Date.now();
            existing._version += 1;
            existing._synced = false;
            store.set(id, existing);
        }
        else {
            store.delete(id);
        }
        return true;
    }
    async clear(collection) {
        this.stores.delete(collection);
    }
    async listCollections() {
        return Array.from(this.stores.keys());
    }
}
exports.MemoryStorageAdapter = MemoryStorageAdapter;
//# sourceMappingURL=memory-storage-adapter.js.map