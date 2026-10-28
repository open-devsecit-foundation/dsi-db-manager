"use strict";
/**
 * db-manager - IndexedDB Local Storage Adapter
 * Designed for Browser & Electron Renderer environments.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexedDbAdapter = void 0;
const memory_storage_adapter_1 = require("./memory-storage-adapter");
class IndexedDbAdapter {
    name = 'indexeddb';
    dbName;
    version;
    db = null;
    knownStores = new Set();
    constructor(options) {
        this.dbName = options?.dbName || 'db_manager_offline_store';
        this.version = options?.version || 1;
    }
    async init() {
        if (typeof window === 'undefined' || !window.indexedDB) {
            throw new Error('[db-manager] IndexedDB is not supported in this environment.');
        }
        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Default core tables / collections
                const initialStores = [
                    'sync_queue',
                    'sync_meta',
                    'patients',
                    'doctors',
                    'appointments',
                    'prescriptions',
                    'invoices',
                    'medical_records',
                    'clinics',
                    'users',
                    'activity_logs',
                    'key_value',
                    'generic_documents',
                ];
                for (const storeName of initialStores) {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { keyPath: '_id' });
                        store.createIndex('_updatedAt', '_updatedAt', { unique: false });
                        store.createIndex('_synced', '_synced', { unique: false });
                        store.createIndex('_deleted', '_deleted', { unique: false });
                    }
                }
            };
            request.onsuccess = (event) => {
                this.db = event.target.result;
                for (let i = 0; i < this.db.objectStoreNames.length; i++) {
                    this.knownStores.add(this.db.objectStoreNames[i]);
                }
                resolve();
            };
            request.onerror = (event) => {
                reject(new Error(`[db-manager] Failed to open IndexedDB: ${event.target.error}`));
            };
        });
    }
    async close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
    async ensureStore(collection) {
        if (!this.db)
            await this.init();
        if (this.db && !this.db.objectStoreNames.contains(collection)) {
            // Need version bump to add dynamic store
            this.db.close();
            this.version += 1;
            return new Promise((resolve, reject) => {
                const req = window.indexedDB.open(this.dbName, this.version);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(collection)) {
                        const store = db.createObjectStore(collection, { keyPath: '_id' });
                        store.createIndex('_updatedAt', '_updatedAt', { unique: false });
                        store.createIndex('_synced', '_synced', { unique: false });
                        store.createIndex('_deleted', '_deleted', { unique: false });
                    }
                };
                req.onsuccess = (e) => {
                    this.db = e.target.result;
                    this.knownStores.add(collection);
                    resolve();
                };
                req.onerror = (e) => reject(e.target.error);
            });
        }
    }
    async get(collection, id) {
        await this.ensureStore(collection);
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(collection, 'readonly');
            const store = tx.objectStore(collection);
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    }
    async find(collection, filter, options) {
        await this.ensureStore(collection);
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(collection, 'readonly');
            const store = tx.objectStore(collection);
            const req = store.getAll();
            req.onsuccess = () => {
                const records = req.result || [];
                const filtered = records.filter((rec) => {
                    if (!options?.includeDeleted && rec._deleted)
                        return false;
                    return (0, memory_storage_adapter_1.matchesFilter)(rec, filter);
                });
                resolve((0, memory_storage_adapter_1.sortAndPaginate)(filtered, options));
            };
            req.onerror = () => reject(req.error);
        });
    }
    async put(collection, record) {
        await this.ensureStore(collection);
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(collection, 'readwrite');
            const store = tx.objectStore(collection);
            const req = store.put(record);
            req.onsuccess = () => resolve(record);
            req.onerror = () => reject(req.error);
        });
    }
    async putBatch(collection, records) {
        await this.ensureStore(collection);
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(collection, 'readwrite');
            const store = tx.objectStore(collection);
            for (const rec of records) {
                store.put(rec);
            }
            tx.oncomplete = () => resolve(records);
            tx.onerror = () => reject(tx.error);
        });
    }
    async delete(collection, id, softDelete = true) {
        const existing = await this.get(collection, id);
        if (!existing)
            return false;
        if (softDelete) {
            existing._deleted = true;
            existing._updatedAt = Date.now();
            existing._version += 1;
            existing._synced = false;
            await this.put(collection, existing);
        }
        else {
            await this.ensureStore(collection);
            await new Promise((resolve, reject) => {
                const tx = this.db.transaction(collection, 'readwrite');
                const store = tx.objectStore(collection);
                const req = store.delete(id);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        }
        return true;
    }
    async clear(collection) {
        await this.ensureStore(collection);
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(collection, 'readwrite');
            const store = tx.objectStore(collection);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
    async listCollections() {
        if (!this.db)
            await this.init();
        return Array.from(this.db.objectStoreNames);
    }
}
exports.IndexedDbAdapter = IndexedDbAdapter;
//# sourceMappingURL=indexeddb-adapter.js.map