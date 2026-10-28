"use strict";
/**
 * db-manager - Firebase Realtime Database (RTDB) Remote Adapter
 * Operates over Firebase RTDB REST API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseRtdbAdapter = void 0;
const memory_storage_adapter_1 = require("../local/memory-storage-adapter");
class FirebaseRtdbAdapter {
    name = 'firebase-rtdb';
    type = 'firebase-rtdb';
    baseUrl;
    authToken;
    constructor(config) {
        this.baseUrl = config.databaseUrl.replace(/\/+$/, '');
        this.authToken = config.authToken;
    }
    async connect() {
        // REST API is stateless
    }
    async disconnect() {
        // No-op
    }
    async ping() {
        try {
            const url = `${this.baseUrl}/.json?shallow=true${this.authToken ? `&auth=${this.authToken}` : ''}`;
            const res = await fetch(url);
            return res.ok;
        }
        catch {
            return false;
        }
    }
    buildUrl(path) {
        const cleanPath = path.replace(/^\/+/, '');
        const authParam = this.authToken ? `?auth=${encodeURIComponent(this.authToken)}` : '';
        return `${this.baseUrl}/${cleanPath}.json${authParam}`;
    }
    async get(collection, id) {
        const url = this.buildUrl(`${collection}/${id}`);
        const res = await fetch(url);
        if (!res.ok) {
            if (res.status === 404)
                return null;
            throw new Error(`[db-manager:firebase-rtdb] GET error HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!data)
            return null;
        return { ...data, _id: id, _synced: true };
    }
    async find(collection, filter, options) {
        const url = this.buildUrl(collection);
        const res = await fetch(url);
        if (!res.ok)
            return [];
        const data = await res.json();
        if (!data || typeof data !== 'object')
            return [];
        const records = Object.entries(data).map(([id, val]) => ({
            ...val,
            _id: id,
            _synced: true,
        }));
        const filtered = records.filter((rec) => {
            if (!options?.includeDeleted && rec._deleted)
                return false;
            return (0, memory_storage_adapter_1.matchesFilter)(rec, filter);
        });
        return (0, memory_storage_adapter_1.sortAndPaginate)(filtered, options);
    }
    async insert(collection, record) {
        const url = this.buildUrl(`${collection}/${record._id}`);
        const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record),
        });
        if (!res.ok) {
            throw new Error(`[db-manager:firebase-rtdb] INSERT error HTTP ${res.status}: ${await res.text()}`);
        }
        return { ...record, _synced: true };
    }
    async update(collection, id, record) {
        const url = this.buildUrl(`${collection}/${id}`);
        const res = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record),
        });
        if (!res.ok) {
            throw new Error(`[db-manager:firebase-rtdb] UPDATE error HTTP ${res.status}: ${await res.text()}`);
        }
        const updated = await this.get(collection, id);
        if (!updated) {
            return { ...record, _id: id, _synced: true };
        }
        return updated;
    }
    async delete(collection, id) {
        const url = this.buildUrl(`${collection}/${id}`);
        const res = await fetch(url, { method: 'DELETE' });
        return res.ok;
    }
    async fetchChangesSince(collection, timestampMs) {
        // RTDB orderBy="_updatedAt"&startAt=timestampMs
        try {
            const all = await this.find(collection, { _updatedAt: { $gt: timestampMs } });
            return all;
        }
        catch {
            return [];
        }
    }
}
exports.FirebaseRtdbAdapter = FirebaseRtdbAdapter;
//# sourceMappingURL=firebase-rtdb-adapter.js.map