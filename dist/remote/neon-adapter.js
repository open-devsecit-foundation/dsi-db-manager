"use strict";
/**
 * db-manager - Neon Serverless Postgres Remote Adapter
 * Operates over Neon Serverless HTTP SQL API or PostgreSQL gateway.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeonAdapter = void 0;
class NeonAdapter {
    name = 'neon';
    type = 'neon';
    host = '';
    user = '';
    password = '';
    database = '';
    initializedTables = new Set();
    constructor(config) {
        if (config.connectionString) {
            try {
                const parsed = new URL(config.connectionString);
                this.host = parsed.hostname;
                this.user = parsed.username;
                this.password = parsed.password;
                this.database = parsed.pathname.replace(/^\//, '') || 'neondb';
            }
            catch (e) {
                console.error('[db-manager:neon] Invalid connection string URL:', e);
            }
        }
        else {
            this.host = config.host || '';
            this.user = config.user || '';
            this.password = config.password || '';
            this.database = config.database || 'neondb';
        }
    }
    async connect() { }
    async disconnect() { }
    /**
     * Executes SQL via Neon's HTTP SQL gateway
     */
    async query(sql, params = []) {
        if (!this.host) {
            throw new Error('[db-manager:neon] Neon host is not configured.');
        }
        const endpoint = `https://${this.host}/sql`;
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.password}`,
                'Neon-Connection-String': `postgres://${this.user}:${this.password}@${this.host}/${this.database}?sslmode=require`,
            },
            body: JSON.stringify({ query: sql, params }),
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`[db-manager:neon] SQL execution error (${res.status}): ${errText}`);
        }
        const data = await res.json();
        return data?.rows || [];
    }
    async ping() {
        try {
            const rows = await this.query('SELECT 1 as alive');
            return rows.length > 0;
        }
        catch {
            return false;
        }
    }
    async ensureTable(table) {
        if (this.initializedTables.has(table))
            return;
        const sql = `
      CREATE TABLE IF NOT EXISTS "${table}" (
        _id VARCHAR(128) PRIMARY KEY,
        _version BIGINT DEFAULT 1,
        _createdAt BIGINT NOT NULL,
        _updatedAt BIGINT NOT NULL,
        _deleted BOOLEAN DEFAULT FALSE,
        _data JSONB NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "idx_${table}_updatedAt" ON "${table}" (_updatedAt);
    `;
        try {
            await this.query(sql);
            this.initializedTables.add(table);
        }
        catch (err) {
            console.warn(`[db-manager:neon] Notice on table creation for "${table}":`, err);
        }
    }
    async get(collection, id) {
        await this.ensureTable(collection);
        const sql = `SELECT _id, _version, _createdAt, _updatedAt, _deleted, _data FROM "${collection}" WHERE _id = $1 LIMIT 1`;
        const rows = await this.query(sql, [id]);
        if (rows.length === 0)
            return null;
        const r = rows[0];
        const data = typeof r._data === 'string' ? JSON.parse(r._data) : r._data;
        return {
            ...data,
            _id: r._id,
            _version: Number(r._version),
            _createdAt: Number(r._createdat || r._createdAt),
            _updatedAt: Number(r._updatedat || r._updatedAt),
            _deleted: Boolean(r._deleted),
            _synced: true,
        };
    }
    async find(collection, filter, options) {
        await this.ensureTable(collection);
        let sql = `SELECT _id, _version, _createdAt, _updatedAt, _deleted, _data FROM "${collection}"`;
        const where = [];
        const params = [];
        if (!options?.includeDeleted) {
            where.push(`_deleted = FALSE`);
        }
        if (where.length > 0) {
            sql += ` WHERE ` + where.join(' AND ');
        }
        sql += ` ORDER BY _updatedAt DESC`;
        if (options?.limit) {
            params.push(options.limit);
            sql += ` LIMIT $${params.length}`;
        }
        if (options?.offset) {
            params.push(options.offset);
            sql += ` OFFSET $${params.length}`;
        }
        const rows = await this.query(sql, params);
        return rows.map((r) => {
            const data = typeof r._data === 'string' ? JSON.parse(r._data) : r._data;
            return {
                ...data,
                _id: r._id,
                _version: Number(r._version),
                _createdAt: Number(r._createdat || r._createdAt),
                _updatedAt: Number(r._updatedat || r._updatedAt),
                _deleted: Boolean(r._deleted),
                _synced: true,
            };
        });
    }
    async insert(collection, record) {
        await this.ensureTable(collection);
        const sql = `
      INSERT INTO "${collection}" (_id, _version, _createdAt, _updatedAt, _deleted, _data)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (_id) DO UPDATE SET
        _version = EXCLUDED._version,
        _updatedAt = EXCLUDED._updatedAt,
        _deleted = EXCLUDED._deleted,
        _data = EXCLUDED._data;
    `;
        const cleanData = { ...record };
        await this.query(sql, [
            record._id,
            record._version,
            record._createdAt,
            record._updatedAt,
            record._deleted,
            JSON.stringify(cleanData),
        ]);
        return { ...record, _synced: true };
    }
    async update(collection, id, record) {
        await this.ensureTable(collection);
        const existing = await this.get(collection, id);
        const merged = { ...(existing || {}), ...record, _id: id };
        const sql = `
      UPDATE "${collection}"
      SET _version = $1, _updatedAt = $2, _deleted = $3, _data = $4
      WHERE _id = $5;
    `;
        await this.query(sql, [
            merged._version || 1,
            merged._updatedAt || Date.now(),
            Boolean(merged._deleted),
            JSON.stringify(merged),
            id,
        ]);
        return { ...merged, _synced: true };
    }
    async delete(collection, id) {
        await this.ensureTable(collection);
        const sql = `DELETE FROM "${collection}" WHERE _id = $1;`;
        await this.query(sql, [id]);
        return true;
    }
    async fetchChangesSince(collection, timestampMs) {
        await this.ensureTable(collection);
        const sql = `SELECT _id, _version, _createdAt, _updatedAt, _deleted, _data FROM "${collection}" WHERE _updatedAt > $1 ORDER BY _updatedAt ASC`;
        const rows = await this.query(sql, [timestampMs]);
        return rows.map((r) => {
            const data = typeof r._data === 'string' ? JSON.parse(r._data) : r._data;
            return {
                ...data,
                _id: r._id,
                _version: Number(r._version),
                _createdAt: Number(r._createdat || r._createdAt),
                _updatedAt: Number(r._updatedat || r._updatedAt),
                _deleted: Boolean(r._deleted),
                _synced: true,
            };
        });
    }
}
exports.NeonAdapter = NeonAdapter;
//# sourceMappingURL=neon-adapter.js.map