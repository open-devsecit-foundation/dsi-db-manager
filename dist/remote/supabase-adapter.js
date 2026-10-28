"use strict";
/**
 * db-manager - Supabase Remote Adapter
 * Communicates with Supabase PostgREST endpoint natively.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAdapter = void 0;
class SupabaseAdapter {
    name = 'supabase';
    type = 'supabase';
    url;
    key;
    schema;
    constructor(config) {
        this.url = config.supabaseUrl.replace(/\/+$/, '');
        this.key = config.supabaseKey;
        this.schema = config.schema || 'public';
    }
    async connect() {
        // Stateless PostgREST; verified via ping
    }
    async disconnect() {
        // No-op
    }
    async ping() {
        try {
            const res = await fetch(`${this.url}/rest/v1/`, {
                method: 'GET',
                headers: {
                    apikey: this.key,
                    Authorization: `Bearer ${this.key}`,
                },
            });
            return res.status < 500;
        }
        catch {
            return false;
        }
    }
    getHeaders(extra) {
        return {
            apikey: this.key,
            Authorization: `Bearer ${this.key}`,
            'Content-Type': 'application/json',
            'Accept-Profile': this.schema,
            'Content-Profile': this.schema,
            ...extra,
        };
    }
    async get(collection, id) {
        const endpoint = `${this.url}/rest/v1/${collection}?_id=eq.${encodeURIComponent(id)}&select=*`;
        const res = await fetch(endpoint, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        if (!res.ok) {
            if (res.status === 404)
                return null;
            throw new Error(`[db-manager:supabase] GET error HTTP ${res.status}: ${await res.text()}`);
        }
        const data = await res.json();
        if (!data || data.length === 0)
            return null;
        const record = data[0];
        record._synced = true;
        return record;
    }
    async find(collection, filter, options) {
        const params = new URLSearchParams();
        params.set('select', '*');
        if (filter) {
            for (const [key, val] of Object.entries(filter)) {
                if (typeof val === 'object' && val !== null) {
                    for (const [op, opVal] of Object.entries(val)) {
                        if (op === '$eq')
                            params.set(key, `eq.${opVal}`);
                        else if (op === '$ne')
                            params.set(key, `neq.${opVal}`);
                        else if (op === '$gt')
                            params.set(key, `gt.${opVal}`);
                        else if (op === '$gte')
                            params.set(key, `gte.${opVal}`);
                        else if (op === '$lt')
                            params.set(key, `lt.${opVal}`);
                        else if (op === '$lte')
                            params.set(key, `lte.${opVal}`);
                    }
                }
                else if (val !== undefined) {
                    params.set(key, `eq.${val}`);
                }
            }
        }
        if (options?.limit)
            params.set('limit', String(options.limit));
        if (options?.offset)
            params.set('offset', String(options.offset));
        const endpoint = `${this.url}/rest/v1/${collection}?${params.toString()}`;
        const res = await fetch(endpoint, {
            method: 'GET',
            headers: this.getHeaders(),
        });
        if (!res.ok) {
            throw new Error(`[db-manager:supabase] FIND error HTTP ${res.status}: ${await res.text()}`);
        }
        const rows = await res.json();
        return rows.map((r) => ({ ...r, _synced: true }));
    }
    async insert(collection, record) {
        const endpoint = `${this.url}/rest/v1/${collection}`;
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: this.getHeaders({
                Prefer: 'return=representation,resolution=merge-duplicates',
            }),
            body: JSON.stringify(record),
        });
        if (!res.ok) {
            throw new Error(`[db-manager:supabase] INSERT error HTTP ${res.status}: ${await res.text()}`);
        }
        const data = await res.json();
        const inserted = Array.isArray(data) ? data[0] : record;
        return { ...inserted, _synced: true };
    }
    async update(collection, id, record) {
        const endpoint = `${this.url}/rest/v1/${collection}?_id=eq.${encodeURIComponent(id)}`;
        const res = await fetch(endpoint, {
            method: 'PATCH',
            headers: this.getHeaders({
                Prefer: 'return=representation',
            }),
            body: JSON.stringify(record),
        });
        if (!res.ok) {
            throw new Error(`[db-manager:supabase] UPDATE error HTTP ${res.status}: ${await res.text()}`);
        }
        const data = await res.json();
        const updated = Array.isArray(data) ? data[0] : { ...record, _id: id };
        return { ...updated, _synced: true };
    }
    async delete(collection, id) {
        const endpoint = `${this.url}/rest/v1/${collection}?_id=eq.${encodeURIComponent(id)}`;
        const res = await fetch(endpoint, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
        return res.ok;
    }
    async fetchChangesSince(collection, timestampMs) {
        const endpoint = `${this.url}/rest/v1/${collection}?_updatedAt=gt.${timestampMs}&select=*`;
        try {
            const res = await fetch(endpoint, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            if (!res.ok)
                return [];
            const rows = await res.json();
            return rows.map((r) => ({ ...r, _synced: true }));
        }
        catch {
            return [];
        }
    }
}
exports.SupabaseAdapter = SupabaseAdapter;
//# sourceMappingURL=supabase-adapter.js.map