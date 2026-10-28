"use strict";
/**
 * db-manager - Direct MySQL Remote Adapter
 * Supports direct MySQL connection via mysql2 (Node.js/Electron) or HTTP MySQL Bridge.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MysqlAdapter = void 0;
class MysqlAdapter {
    name = 'mysql';
    type = 'mysql';
    host;
    port;
    user;
    password;
    database;
    httpBridgeUrl;
    connectionPool = null;
    initializedTables = new Set();
    constructor(config) {
        this.host = config.host || 'localhost';
        this.port = config.port || 3306;
        this.user = config.user || 'root';
        this.password = config.password || '';
        this.database = config.database;
        this.httpBridgeUrl = config.httpBridgeUrl;
    }
    async connect() {
        if (this.httpBridgeUrl)
            return;
        try {
            // Dynamic require of mysql2/promise in Node / Electron main
            const mysql = require('mysql2/promise');
            this.connectionPool = mysql.createPool({
                host: this.host,
                port: this.port,
                user: this.user,
                password: this.password,
                database: this.database,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
            });
        }
        catch {
            // mysql2 not installed or browser runtime; fallback to bridge or informative message
        }
    }
    async disconnect() {
        if (this.connectionPool) {
            await this.connectionPool.end();
            this.connectionPool = null;
        }
    }
    async execute(sql, params = []) {
        if (this.httpBridgeUrl) {
            const res = await fetch(`${this.httpBridgeUrl}/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql, params, database: this.database }),
            });
            if (!res.ok)
                throw new Error(`[db-manager:mysql] HTTP bridge error: ${await res.text()}`);
            const json = await res.json();
            return json.rows || json;
        }
        if (!this.connectionPool) {
            await this.connect();
        }
        if (!this.connectionPool) {
            throw new Error('[db-manager:mysql] mysql2 driver is not available and no httpBridgeUrl was specified.');
        }
        const [results] = await this.connectionPool.execute(sql, params);
        return results;
    }
    async ping() {
        try {
            const res = await this.execute('SELECT 1 as alive');
            return Array.isArray(res) && res.length > 0;
        }
        catch {
            return false;
        }
    }
    async ensureTable(table) {
        if (this.initializedTables.has(table))
            return;
        const sql = `
      CREATE TABLE IF NOT EXISTS \`${table}\` (
        \`_id\` VARCHAR(128) PRIMARY KEY,
        \`_version\` BIGINT DEFAULT 1,
        \`_createdAt\` BIGINT NOT NULL,
        \`_updatedAt\` BIGINT NOT NULL,
        \`_deleted\` TINYINT(1) DEFAULT 0,
        \`_data\` JSON NOT NULL,
        INDEX \`idx_${table}_updatedAt\` (\`_updatedAt\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
        try {
            await this.execute(sql);
            this.initializedTables.add(table);
        }
        catch (err) {
            console.warn(`[db-manager:mysql] Table notice for "${table}":`, err);
        }
    }
    async get(collection, id) {
        await this.ensureTable(collection);
        const sql = `SELECT _id, _version, _createdAt, _updatedAt, _deleted, _data FROM \`${collection}\` WHERE _id = ? LIMIT 1`;
        const rows = await this.execute(sql, [id]);
        if (!rows || rows.length === 0)
            return null;
        const r = rows[0];
        const data = typeof r._data === 'string' ? JSON.parse(r._data) : r._data;
        return {
            ...data,
            _id: r._id,
            _version: Number(r._version),
            _createdAt: Number(r._createdAt),
            _updatedAt: Number(r._updatedAt),
            _deleted: Boolean(r._deleted),
            _synced: true,
        };
    }
    async find(collection, filter, options) {
        await this.ensureTable(collection);
        let sql = `SELECT _id, _version, _createdAt, _updatedAt, _deleted, _data FROM \`${collection}\``;
        const where = [];
        const params = [];
        if (!options?.includeDeleted) {
            where.push(`_deleted = 0`);
        }
        if (where.length > 0) {
            sql += ` WHERE ` + where.join(' AND ');
        }
        sql += ` ORDER BY _updatedAt DESC`;
        if (options?.limit) {
            sql += ` LIMIT ?`;
            params.push(options.limit);
        }
        if (options?.offset) {
            sql += ` OFFSET ?`;
            params.push(options.offset);
        }
        const rows = await this.execute(sql, params);
        if (!Array.isArray(rows))
            return [];
        return rows.map((r) => {
            const data = typeof r._data === 'string' ? JSON.parse(r._data) : r._data;
            return {
                ...data,
                _id: r._id,
                _version: Number(r._version),
                _createdAt: Number(r._createdAt),
                _updatedAt: Number(r._updatedAt),
                _deleted: Boolean(r._deleted),
                _synced: true,
            };
        });
    }
    async insert(collection, record) {
        await this.ensureTable(collection);
        const sql = `
      INSERT INTO \`${collection}\` (_id, _version, _createdAt, _updatedAt, _deleted, _data)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        _version = VALUES(_version),
        _updatedAt = VALUES(_updatedAt),
        _deleted = VALUES(_deleted),
        _data = VALUES(_data);
    `;
        const cleanData = { ...record };
        await this.execute(sql, [
            record._id,
            record._version,
            record._createdAt,
            record._updatedAt,
            record._deleted ? 1 : 0,
            JSON.stringify(cleanData),
        ]);
        return { ...record, _synced: true };
    }
    async update(collection, id, record) {
        await this.ensureTable(collection);
        const existing = await this.get(collection, id);
        const merged = { ...(existing || {}), ...record, _id: id };
        const sql = `
      UPDATE \`${collection}\`
      SET _version = ?, _updatedAt = ?, _deleted = ?, _data = ?
      WHERE _id = ?;
    `;
        await this.execute(sql, [
            merged._version || 1,
            merged._updatedAt || Date.now(),
            merged._deleted ? 1 : 0,
            JSON.stringify(merged),
            id,
        ]);
        return { ...merged, _synced: true };
    }
    async delete(collection, id) {
        await this.ensureTable(collection);
        const sql = `DELETE FROM \`${collection}\` WHERE _id = ?;`;
        await this.execute(sql, [id]);
        return true;
    }
    async fetchChangesSince(collection, timestampMs) {
        await this.ensureTable(collection);
        const sql = `SELECT _id, _version, _createdAt, _updatedAt, _deleted, _data FROM \`${collection}\` WHERE _updatedAt > ? ORDER BY _updatedAt ASC`;
        const rows = await this.execute(sql, [timestampMs]);
        if (!Array.isArray(rows))
            return [];
        return rows.map((r) => {
            const data = typeof r._data === 'string' ? JSON.parse(r._data) : r._data;
            return {
                ...data,
                _id: r._id,
                _version: Number(r._version),
                _createdAt: Number(r._createdAt),
                _updatedAt: Number(r._updatedAt),
                _deleted: Boolean(r._deleted),
                _synced: true,
            };
        });
    }
}
exports.MysqlAdapter = MysqlAdapter;
//# sourceMappingURL=mysql-adapter.js.map