"use strict";
/**
 * db-manager - Cloud Firestore Remote Adapter
 * Operates over Cloud Firestore v1 REST API.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreAdapter = void 0;
const memory_storage_adapter_1 = require("../local/memory-storage-adapter");
class FirestoreAdapter {
    name = 'firestore';
    type = 'firestore';
    projectId;
    databaseId;
    apiKey;
    accessToken;
    constructor(config) {
        this.projectId = config.projectId;
        this.databaseId = config.databaseId || '(default)';
        this.apiKey = config.apiKey;
        this.accessToken = config.accessToken;
    }
    async connect() { }
    async disconnect() { }
    getBaseUrl() {
        return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/${this.databaseId}/documents`;
    }
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }
        return headers;
    }
    async ping() {
        try {
            const url = `${this.getBaseUrl()}?pageSize=1${this.apiKey ? `&key=${this.apiKey}` : ''}`;
            const res = await fetch(url, { headers: this.getHeaders() });
            return res.status < 500;
        }
        catch {
            return false;
        }
    }
    async get(collection, id) {
        const url = `${this.getBaseUrl()}/${collection}/${id}${this.apiKey ? `?key=${this.apiKey}` : ''}`;
        const res = await fetch(url, { headers: this.getHeaders() });
        if (!res.ok) {
            if (res.status === 404)
                return null;
            throw new Error(`[db-manager:firestore] GET error HTTP ${res.status}`);
        }
        const doc = await res.json();
        return this.firestoreDocToRecord(doc, id);
    }
    async find(collection, filter, options) {
        const url = `${this.getBaseUrl()}/${collection}${this.apiKey ? `?key=${this.apiKey}` : ''}`;
        const res = await fetch(url, { headers: this.getHeaders() });
        if (!res.ok)
            return [];
        const data = await res.json();
        const docs = data.documents || [];
        const records = docs.map((doc) => {
            const parts = doc.name.split('/');
            const id = parts[parts.length - 1];
            return this.firestoreDocToRecord(doc, id);
        });
        const filtered = records.filter((rec) => {
            if (!options?.includeDeleted && rec._deleted)
                return false;
            return (0, memory_storage_adapter_1.matchesFilter)(rec, filter);
        });
        return (0, memory_storage_adapter_1.sortAndPaginate)(filtered, options);
    }
    async insert(collection, record) {
        const url = `${this.getBaseUrl()}/${collection}?documentId=${encodeURIComponent(record._id)}${this.apiKey ? `&key=${this.apiKey}` : ''}`;
        const body = {
            fields: this.recordToFirestoreFields(record),
        };
        const res = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            // If already exists, attempt patch/upsert
            if (res.status === 409) {
                return this.update(collection, record._id, record);
            }
            throw new Error(`[db-manager:firestore] INSERT error HTTP ${res.status}: ${await res.text()}`);
        }
        return { ...record, _synced: true };
    }
    async update(collection, id, record) {
        const fields = this.recordToFirestoreFields(record);
        const updateMaskParams = Object.keys(fields)
            .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
            .join('&');
        const url = `${this.getBaseUrl()}/${collection}/${id}?${updateMaskParams}${this.apiKey ? `&key=${this.apiKey}` : ''}`;
        const res = await fetch(url, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify({ fields }),
        });
        if (!res.ok) {
            throw new Error(`[db-manager:firestore] UPDATE error HTTP ${res.status}: ${await res.text()}`);
        }
        const doc = await res.json();
        return this.firestoreDocToRecord(doc, id);
    }
    async delete(collection, id) {
        const url = `${this.getBaseUrl()}/${collection}/${id}${this.apiKey ? `?key=${this.apiKey}` : ''}`;
        const res = await fetch(url, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });
        return res.ok;
    }
    async fetchChangesSince(collection, timestampMs) {
        return this.find(collection, { _updatedAt: { $gt: timestampMs } });
    }
    /**
     * Translates native JS record to Firestore typed fields
     */
    recordToFirestoreFields(obj) {
        const fields = {};
        for (const [key, val] of Object.entries(obj)) {
            if (val === undefined)
                continue;
            fields[key] = this.jsValueToFirestoreValue(val);
        }
        return fields;
    }
    jsValueToFirestoreValue(val) {
        if (val === null)
            return { nullValue: null };
        if (typeof val === 'boolean')
            return { booleanValue: val };
        if (typeof val === 'number') {
            return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
        }
        if (typeof val === 'string')
            return { stringValue: val };
        if (Array.isArray(val)) {
            return { arrayValue: { values: val.map((v) => this.jsValueToFirestoreValue(v)) } };
        }
        if (typeof val === 'object') {
            return { mapValue: { fields: this.recordToFirestoreFields(val) } };
        }
        return { stringValue: String(val) };
    }
    /**
     * Translates Firestore document fields to native JS record
     */
    firestoreDocToRecord(doc, fallbackId) {
        const record = { _id: fallbackId, _synced: true };
        if (doc.fields) {
            for (const [key, valObj] of Object.entries(doc.fields)) {
                record[key] = this.firestoreValueToJs(valObj);
            }
        }
        return record;
    }
    firestoreValueToJs(valObj) {
        if ('stringValue' in valObj)
            return valObj.stringValue;
        if ('integerValue' in valObj)
            return parseInt(valObj.integerValue, 10);
        if ('doubleValue' in valObj)
            return parseFloat(valObj.doubleValue);
        if ('booleanValue' in valObj)
            return valObj.booleanValue;
        if ('nullValue' in valObj)
            return null;
        if ('mapValue' in valObj) {
            const out = {};
            const fields = valObj.mapValue?.fields || {};
            for (const [k, v] of Object.entries(fields)) {
                out[k] = this.firestoreValueToJs(v);
            }
            return out;
        }
        if ('arrayValue' in valObj) {
            const values = valObj.arrayValue?.values || [];
            return values.map((v) => this.firestoreValueToJs(v));
        }
        return null;
    }
}
exports.FirestoreAdapter = FirestoreAdapter;
//# sourceMappingURL=firestore-adapter.js.map