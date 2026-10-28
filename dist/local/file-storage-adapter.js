"use strict";
/**
 * db-manager - File-Based Local Storage Adapter
 * Designed for Node.js, Electron Main Process, and Desktop Environments.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStorageAdapter = void 0;
const memory_storage_adapter_1 = require("./memory-storage-adapter");
class FileStorageAdapter {
    name = 'file-storage';
    dataDir;
    cache = new Map();
    isNode = false;
    fs = null;
    path = null;
    constructor(options) {
        this.dataDir = options?.dataDir || './.db-manager-data';
        this.detectEnvironment();
    }
    detectEnvironment() {
        try {
            if (typeof process !== 'undefined' && process.versions && process.versions.node) {
                this.fs = require('fs');
                this.path = require('path');
                this.isNode = true;
            }
        }
        catch {
            this.isNode = false;
        }
    }
    async init() {
        if (!this.isNode || !this.fs) {
            console.warn('[db-manager] FileStorageAdapter running in non-Node environment. Falling back to memory store.');
            return;
        }
        try {
            if (!this.fs.existsSync(this.dataDir)) {
                this.fs.mkdirSync(this.dataDir, { recursive: true });
            }
            // Pre-load existing collections into memory cache
            const files = this.fs.readdirSync(this.dataDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const collection = file.replace(/\.json$/, '');
                    const filePath = this.path.join(this.dataDir, file);
                    try {
                        const raw = this.fs.readFileSync(filePath, 'utf-8');
                        const data = JSON.parse(raw);
                        const map = new Map();
                        for (const item of data) {
                            map.set(item._id, item);
                        }
                        this.cache.set(collection, map);
                    }
                    catch (e) {
                        console.error(`[db-manager] Error reading cache file ${file}:`, e);
                    }
                }
            }
        }
        catch (err) {
            console.error('[db-manager] FileStorage init error:', err);
        }
    }
    async close() {
        this.flushAll();
    }
    flushCollection(collection) {
        if (!this.isNode || !this.fs)
            return;
        const store = this.cache.get(collection);
        if (!store)
            return;
        try {
            const filePath = this.path.join(this.dataDir, `${collection}.json`);
            const tempPath = `${filePath}.tmp`;
            const records = Array.from(store.values());
            this.fs.writeFileSync(tempPath, JSON.stringify(records, null, 2), 'utf-8');
            this.fs.renameSync(tempPath, filePath);
        }
        catch (err) {
            console.error(`[db-manager] Failed to persist collection "${collection}":`, err);
        }
    }
    flushAll() {
        for (const collection of this.cache.keys()) {
            this.flushCollection(collection);
        }
    }
    getStore(collection) {
        if (!this.cache.has(collection)) {
            this.cache.set(collection, new Map());
        }
        return this.cache.get(collection);
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
            if (!options?.includeDeleted && rec._deleted)
                return false;
            return (0, memory_storage_adapter_1.matchesFilter)(rec, filter);
        });
        const result = (0, memory_storage_adapter_1.sortAndPaginate)(filtered, options);
        return JSON.parse(JSON.stringify(result));
    }
    async put(collection, record) {
        const store = this.getStore(collection);
        const clone = JSON.parse(JSON.stringify(record));
        store.set(record._id, clone);
        this.flushCollection(collection);
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
        this.flushCollection(collection);
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
        this.flushCollection(collection);
        return true;
    }
    async clear(collection) {
        this.cache.delete(collection);
        if (this.isNode && this.fs) {
            const filePath = this.path.join(this.dataDir, `${collection}.json`);
            if (this.fs.existsSync(filePath)) {
                this.fs.unlinkSync(filePath);
            }
        }
    }
    async listCollections() {
        return Array.from(this.cache.keys());
    }
}
exports.FileStorageAdapter = FileStorageAdapter;
//# sourceMappingURL=file-storage-adapter.js.map