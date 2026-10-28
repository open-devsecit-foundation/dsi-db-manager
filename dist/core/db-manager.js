"use strict";
/**
 * db-manager - Master Orchestrator Class
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbManager = void 0;
const events_1 = require("./events");
const index_1 = require("../local/index");
const collection_1 = require("./collection");
const sync_engine_1 = require("../sync/sync-engine");
const sync_queue_1 = require("../sync/sync-queue");
class DbManager extends events_1.UniversalEventEmitter {
    dbName;
    local;
    remote;
    syncEngine;
    queue;
    collections = new Map();
    isInitialized = false;
    constructor(config) {
        super();
        this.dbName = config?.dbName || 'clinic_db';
        // 1. Resolve Local Storage Engine
        this.local = config?.local || (0, index_1.autoDetectLocalAdapter)(this.dbName);
        // 2. Initialize durable queue
        this.queue = new sync_queue_1.SyncQueue(this.local);
        // 3. Resolve Remote Adapter & Sync Engine
        this.remote = config?.remote;
        if (this.remote) {
            this.syncEngine = new sync_engine_1.SyncEngine(this.local, this.remote, config?.sync);
            this.forwardEvents();
        }
    }
    forwardEvents() {
        if (!this.syncEngine)
            return;
        this.syncEngine.on('sync:start', (data) => this.emit('sync:start', data));
        this.syncEngine.on('sync:complete', (data) => this.emit('sync:complete', data));
        this.syncEngine.on('sync:conflict', (data) => this.emit('sync:conflict', data));
        this.syncEngine.on('sync:error', (data) => this.emit('sync:error', data));
        this.syncEngine.on('network:online', (data) => this.emit('network:online', data));
        this.syncEngine.on('network:offline', (data) => this.emit('network:offline', data));
    }
    /**
     * Initializes local storage and starts sync background listeners
     */
    async init() {
        if (this.isInitialized)
            return this;
        await this.local.init();
        if (this.remote) {
            try {
                await this.remote.connect();
            }
            catch (err) {
                console.warn('[db-manager] Remote connect warning (will operate offline):', err);
            }
            if (this.syncEngine) {
                await this.syncEngine.start();
            }
        }
        this.isInitialized = true;
        return this;
    }
    /**
     * Sets or switches the remote adapter at runtime
     */
    async setRemote(remote) {
        if (this.syncEngine) {
            this.syncEngine.stop();
        }
        this.remote = remote;
        await this.remote.connect();
        this.syncEngine = new sync_engine_1.SyncEngine(this.local, this.remote);
        this.forwardEvents();
        for (const collName of this.collections.keys()) {
            this.syncEngine.registerCollection(collName);
        }
        if (this.isInitialized) {
            await this.syncEngine.start();
        }
    }
    /**
     * Returns a type-safe collection accessor
     */
    collection(name) {
        if (!this.collections.has(name)) {
            const coll = new collection_1.Collection(name, this.local, this.queue, this.syncEngine);
            this.collections.set(name, coll);
        }
        return this.collections.get(name);
    }
    /**
     * Manually triggers an immediate synchronization cycle
     */
    async sync() {
        if (!this.syncEngine) {
            throw new Error('[db-manager] No remote backend adapter configured for sync.');
        }
        return await this.syncEngine.syncNow();
    }
    /**
     * Returns active sync stats and pending mutation count
     */
    async getSyncStats() {
        if (!this.syncEngine) {
            const pending = await this.queue.count();
            return {
                pendingCount: pending,
                totalSynced: 0,
                totalConflicts: 0,
                lastSyncTimestamp: null,
                status: 'offline',
            };
        }
        return await this.syncEngine.getStats();
    }
    /**
     * Checks whether internet connectivity is currently established
     */
    isOnline() {
        if (!this.syncEngine)
            return false;
        return this.syncEngine.getNetworkMonitor().isOnline();
    }
    /**
     * Cleanly closes connections and background timers
     */
    async close() {
        if (this.syncEngine) {
            this.syncEngine.stop();
        }
        if (this.remote) {
            await this.remote.disconnect();
        }
        await this.local.close();
        this.removeAllListeners();
        this.isInitialized = false;
    }
    // Pre-configured clinic & SaaS collection getters for rapid development
    get patients() { return this.collection('patients'); }
    get doctors() { return this.collection('doctors'); }
    get appointments() { return this.collection('appointments'); }
    get prescriptions() { return this.collection('prescriptions'); }
    get invoices() { return this.collection('invoices'); }
    get medicalRecords() { return this.collection('medical_records'); }
    get clinics() { return this.collection('clinics'); }
    get users() { return this.collection('users'); }
    get activityLogs() { return this.collection('activity_logs'); }
    get keyValue() { return this.collection('key_value'); }
    get generic() { return this.collection('generic_documents'); }
}
exports.DbManager = DbManager;
//# sourceMappingURL=db-manager.js.map