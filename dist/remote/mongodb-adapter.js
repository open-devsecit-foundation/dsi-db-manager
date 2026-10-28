"use strict";
/**
 * db-manager - MongoDB Remote Adapter
 * Supports MongoDB native driver (Node.js/Electron) and MongoDB Atlas Data API (REST).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDbAdapter = void 0;
class MongoDbAdapter {
    name = 'mongodb';
    type = 'mongodb';
    uri;
    dbName;
    atlas;
    client = null;
    db = null;
    constructor(config) {
        this.uri = config.uri;
        this.dbName = config.dbName;
        this.atlas = config.atlasDataApi;
    }
    async connect() {
        if (this.atlas)
            return;
        if (this.uri) {
            try {
                const { MongoClient } = require('mongodb');
                this.client = new MongoClient(this.uri);
                await this.client.connect();
                this.db = this.client.db(this.dbName);
            }
            catch {
                // Driver not available or running in non-node runtime
            }
        }
    }
    async disconnect() {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
        }
    }
    async ping() {
        if (this.atlas) {
            try {
                const res = await this.atlasRequest('findOne', 'system.version', {});
                return res !== undefined;
            }
            catch {
                return false;
            }
        }
        if (!this.db)
            await this.connect();
        if (this.db) {
            try {
                const res = await this.db.command({ ping: 1 });
                return res?.ok === 1;
            }
            catch {
                return false;
            }
        }
        return false;
    }
    async atlasRequest(action, collection, payload) {
        if (!this.atlas)
            throw new Error('[db-manager:mongodb] Atlas Data API not configured');
        const url = `${this.atlas.endpoint.replace(/\/+$/, '')}/action/${action}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': this.atlas.apiKey,
            },
            body: JSON.stringify({
                dataSource: this.atlas.dataSource,
                database: this.dbName,
                collection,
                ...payload,
            }),
        });
        if (!res.ok) {
            throw new Error(`[db-manager:mongodb] Atlas error HTTP ${res.status}: ${await res.text()}`);
        }
        return await res.json();
    }
    async get(collection, id) {
        if (this.atlas) {
            const res = await this.atlasRequest('findOne', collection, { filter: { _id: id } });
            if (!res?.document)
                return null;
            return { ...res.document, _synced: true };
        }
        if (!this.db)
            await this.connect();
        if (!this.db)
            throw new Error('[db-manager:mongodb] MongoDB driver is not connected');
        const doc = await this.db.collection(collection).findOne({ _id: id });
        if (!doc)
            return null;
        return { ...doc, _synced: true };
    }
    async find(collection, filter, options) {
        const mongoFilter = { ...(filter || {}) };
        if (!options?.includeDeleted) {
            mongoFilter._deleted = { $ne: true };
        }
        if (this.atlas) {
            const res = await this.atlasRequest('find', collection, {
                filter: mongoFilter,
                limit: options?.limit,
                skip: options?.offset,
                sort: options?.sort,
            });
            const docs = res?.documents || [];
            return docs.map((d) => ({ ...d, _synced: true }));
        }
        if (!this.db)
            await this.connect();
        if (!this.db)
            throw new Error('[db-manager:mongodb] MongoDB driver is not connected');
        let cursor = this.db.collection(collection).find(mongoFilter);
        if (options?.sort)
            cursor = cursor.sort(options.sort);
        if (options?.offset)
            cursor = cursor.skip(options.offset);
        if (options?.limit)
            cursor = cursor.limit(options.limit);
        const docs = await cursor.toArray();
        return docs.map((d) => ({ ...d, _synced: true }));
    }
    async insert(collection, record) {
        if (this.atlas) {
            await this.atlasRequest('updateOne', collection, {
                filter: { _id: record._id },
                update: { $set: record },
                upsert: true,
            });
            return { ...record, _synced: true };
        }
        if (!this.db)
            await this.connect();
        if (!this.db)
            throw new Error('[db-manager:mongodb] MongoDB driver is not connected');
        await this.db.collection(collection).updateOne({ _id: record._id }, { $set: record }, { upsert: true });
        return { ...record, _synced: true };
    }
    async update(collection, id, record) {
        const cleanUpdate = { ...record };
        delete cleanUpdate._id;
        if (this.atlas) {
            await this.atlasRequest('updateOne', collection, {
                filter: { _id: id },
                update: { $set: cleanUpdate },
            });
            const updated = await this.get(collection, id);
            return updated;
        }
        if (!this.db)
            await this.connect();
        if (!this.db)
            throw new Error('[db-manager:mongodb] MongoDB driver is not connected');
        await this.db.collection(collection).updateOne({ _id: id }, { $set: cleanUpdate });
        const updated = await this.get(collection, id);
        return updated;
    }
    async delete(collection, id) {
        if (this.atlas) {
            const res = await this.atlasRequest('deleteOne', collection, { filter: { _id: id } });
            return res?.deletedCount > 0;
        }
        if (!this.db)
            await this.connect();
        if (!this.db)
            throw new Error('[db-manager:mongodb] MongoDB driver is not connected');
        const res = await this.db.collection(collection).deleteOne({ _id: id });
        return res?.deletedCount > 0;
    }
    async fetchChangesSince(collection, timestampMs) {
        return this.find(collection, { _updatedAt: { $gt: timestampMs } });
    }
}
exports.MongoDbAdapter = MongoDbAdapter;
//# sourceMappingURL=mongodb-adapter.js.map