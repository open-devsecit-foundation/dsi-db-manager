"use strict";
/**
 * db-manager - DSIAPI Remote Adapter
 * Integrates directly with DevSecIt Rust API Engine (v1.0.0 High-Performance Dual Engine).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DsiApiAdapter = void 0;
class DsiApiAdapter {
    name = 'dsiapi';
    type = 'dsiapi';
    endpoint;
    token = null;
    credentials;
    tokenExpiryTime = 0;
    constructor(config) {
        this.endpoint = (config?.endpoint || 'http://localhost:8899').replace(/\/+$/, '');
        this.token = config?.token || null;
        this.credentials = config?.credentials;
    }
    async connect() {
        if (!this.token && this.credentials) {
            await this.generateToken();
        }
    }
    async disconnect() {
        // Stateless HTTP engine; no persistent socket to close
    }
    async ping() {
        try {
            const res = await fetch(`${this.endpoint}/health`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });
            if (!res.ok)
                return false;
            const json = await res.json();
            return json?.status === 'ok';
        }
        catch {
            return false;
        }
    }
    /**
     * Auto-generate authentication token via DSIAPI's /gen_token endpoint
     */
    async generateToken() {
        if (!this.credentials) {
            throw new Error('[db-manager:dsiapi] No token or credentials provided.');
        }
        const { dbName, dbPass, user = 'root', expiryDays = 30, driver = 'mysql' } = this.credentials;
        const url = `${this.endpoint}/gen_token.php?db_name=${encodeURIComponent(dbName)}&db_pass=${encodeURIComponent(dbPass)}&user=${encodeURIComponent(user)}&expiry=${expiryDays}&driver=${driver}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`[db-manager:dsiapi] Failed to generate token: HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data.err || !data.token) {
            throw new Error(`[db-manager:dsiapi] Token error: ${data.msg || 'Unknown error'}`);
        }
        this.token = data.token;
        this.tokenExpiryTime = Date.now() + expiryDays * 24 * 60 * 60 * 1000;
        return this.token;
    }
    async ensureToken() {
        if (!this.token || (this.credentials && Date.now() >= this.tokenExpiryTime - 60000)) {
            if (this.credentials) {
                return await this.generateToken();
            }
            throw new Error('[db-manager:dsiapi] Token is missing or expired.');
        }
        return this.token;
    }
    /**
     * Dispatches requests to DSIAPI Gateway (POST /)
     */
    async request(payload) {
        const token = await this.ensureToken();
        const res = await fetch(`${this.endpoint}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`[db-manager:dsiapi] HTTP ${res.status}: ${text}`);
        }
        const data = await res.json();
        if (data.err) {
            throw new Error(`[db-manager:dsiapi] Engine error: ${data.msg || JSON.stringify(data)}`);
        }
        return data;
    }
    async get(collection, id) {
        // Condition must not trigger firewall (e.g. avoid '1=1')
        const safeCondition = `_id = '${id.replace(/'/g, "\\'")}'`;
        const res = await this.request({
            method: 'GET',
            table: collection,
            condition: safeCondition,
        });
        if (!res.data || res.data.length === 0) {
            return null;
        }
        return this.deserializeRecord(res.data[0]);
    }
    async find(collection, filter, options) {
        let condition = undefined;
        if (filter && Object.keys(filter).length > 0) {
            const parts = [];
            for (const [k, v] of Object.entries(filter)) {
                if (typeof v === 'string') {
                    parts.push(`${k} = '${v.replace(/'/g, "\\'")}'`);
                }
                else if (typeof v === 'number' || typeof v === 'boolean') {
                    parts.push(`${k} = ${v}`);
                }
            }
            if (parts.length > 0) {
                condition = parts.join(' AND ');
            }
        }
        const payload = {
            method: 'GET',
            table: collection,
        };
        if (condition) {
            payload.condition = condition;
        }
        try {
            const res = await this.request(payload);
            const rows = res.data || [];
            return rows.map((r) => this.deserializeRecord(r));
        }
        catch (err) {
            // If table doesn't exist yet, return empty list
            if (err.message && err.message.toLowerCase().includes("doesn't exist")) {
                return [];
            }
            throw err;
        }
    }
    async insert(collection, record) {
        // DSIAPI auto-creates table and missing columns on INSERT!
        const serialized = this.serializeRecord(record);
        const payload = {
            method: 'INSERT',
            table: collection,
            ...serialized,
        };
        await this.request(payload);
        return record;
    }
    async update(collection, id, record) {
        const safeCondition = `_id = '${id.replace(/'/g, "\\'")}'`;
        const serialized = this.serializeRecord(record);
        delete serialized._id; // Don't attempt to mutate primary _id
        const payload = {
            method: 'UPDATE',
            table: collection,
            condition: safeCondition,
            ...serialized,
        };
        await this.request(payload);
        const updated = await this.get(collection, id);
        if (!updated) {
            throw new Error(`[db-manager:dsiapi] Failed to retrieve updated record ${id}`);
        }
        return updated;
    }
    async delete(collection, id) {
        const safeCondition = `_id = '${id.replace(/'/g, "\\'")}'`;
        const payload = {
            method: 'DELETE',
            table: collection,
            condition: safeCondition,
        };
        const res = await this.request(payload);
        return !res.err;
    }
    async fetchChangesSince(collection, timestampMs) {
        const condition = `_updatedAt > ${timestampMs}`;
        try {
            const res = await this.request({
                method: 'GET',
                table: collection,
                condition: condition,
            });
            const rows = res.data || [];
            return rows.map((r) => this.deserializeRecord(r));
        }
        catch {
            return [];
        }
    }
    /**
     * Serializes nested objects/arrays to JSON strings for DSIAPI SQL columns
     */
    serializeRecord(record) {
        const out = {};
        for (const [key, value] of Object.entries(record)) {
            if (value === undefined)
                continue;
            if (typeof value === 'object' && value !== null) {
                out[key] = JSON.stringify(value);
            }
            else {
                out[key] = value;
            }
        }
        return out;
    }
    /**
     * Deserializes JSON string columns back to objects
     */
    deserializeRecord(row) {
        const out = { ...row };
        for (const [key, val] of Object.entries(out)) {
            if (typeof val === 'string') {
                if ((val.startsWith('{') && val.endsWith('}')) || (val.startsWith('[') && val.endsWith(']'))) {
                    try {
                        out[key] = JSON.parse(val);
                    }
                    catch {
                        // Keep as string
                    }
                }
            }
        }
        // Ensure millisecond timestamps are numbers
        if (out._createdAt)
            out._createdAt = Number(out._createdAt);
        if (out._updatedAt)
            out._updatedAt = Number(out._updatedAt);
        if (out._version)
            out._version = Number(out._version);
        if (out._deleted !== undefined)
            out._deleted = Boolean(Number(out._deleted) || out._deleted === true || out._deleted === 'true');
        out._synced = true;
        return out;
    }
}
exports.DsiApiAdapter = DsiApiAdapter;
//# sourceMappingURL=dsiapi-adapter.js.map