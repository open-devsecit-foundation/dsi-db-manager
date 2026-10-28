"use strict";
/**
 * db-manager - Bidirectional Sync Engine
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncEngine = void 0;
const events_1 = require("../core/events");
const sync_queue_1 = require("./sync-queue");
const network_monitor_1 = require("./network-monitor");
const conflict_resolver_1 = require("./conflict-resolver");
const config_1 = require("../core/config");
const SYNC_META_COLLECTION = 'sync_meta';
const LAST_SYNC_KEY = 'last_sync_timestamp';
class SyncEngine extends events_1.UniversalEventEmitter {
    local;
    remote;
    queue;
    monitor;
    resolver;
    config;
    isSyncing = false;
    syncTimer = null;
    totalSyncedCount = 0;
    totalConflictCount = 0;
    lastSyncTimestamp = null;
    collectionsToSync = new Set();
    constructor(local, remote, config) {
        super();
        this.local = local;
        this.remote = remote;
        this.config = { ...config_1.DEFAULT_SYNC_CONFIG, ...(config || {}) };
        this.queue = new sync_queue_1.SyncQueue(local);
        this.resolver = new conflict_resolver_1.ConflictResolver({
            strategy: this.config.conflictStrategy,
            customResolver: this.config.onConflict,
        });
        this.monitor = new network_monitor_1.NetworkMonitor({
            heartbeatUrl: this.config.heartbeatUrl,
            checkIntervalMs: this.config.heartbeatIntervalMs,
            pingFn: () => this.remote.ping(),
        });
        this.setupListeners();
    }
    setupListeners() {
        this.monitor.on('online', async () => {
            this.emit('network:online', { timestamp: Date.now() });
            if (this.config.autoSyncOnOnline) {
                await this.syncNow();
            }
        });
        this.monitor.on('offline', () => {
            this.emit('network:offline', { timestamp: Date.now() });
        });
    }
    registerCollection(collection) {
        if (collection !== 'sync_queue' && collection !== 'sync_meta') {
            this.collectionsToSync.add(collection);
        }
    }
    getQueue() {
        return this.queue;
    }
    getNetworkMonitor() {
        return this.monitor;
    }
    getConflictResolver() {
        return this.resolver;
    }
    async start() {
        await this.loadLastSyncTimestamp();
        if (this.config.syncIntervalMs > 0) {
            if (this.syncTimer)
                clearInterval(this.syncTimer);
            this.syncTimer = setInterval(async () => {
                if (this.monitor.isOnline()) {
                    await this.syncNow();
                }
            }, this.config.syncIntervalMs);
        }
        // Initial check
        setTimeout(() => {
            this.monitor.probe().then((online) => {
                if (online && this.config.autoSyncOnOnline) {
                    this.syncNow();
                }
            });
        }, 500);
    }
    stop() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
        }
        this.monitor.stop();
    }
    async loadLastSyncTimestamp() {
        try {
            const rec = await this.local.get(SYNC_META_COLLECTION, LAST_SYNC_KEY);
            if (rec && rec.value) {
                this.lastSyncTimestamp = Number(rec.value);
            }
        }
        catch {
            this.lastSyncTimestamp = null;
        }
    }
    async saveLastSyncTimestamp(ts) {
        this.lastSyncTimestamp = ts;
        const metaRecord = {
            _id: LAST_KEY,
            value: ts,
            _version: 1,
            _createdAt: ts,
            _updatedAt: ts,
            _deleted: false,
            _synced: true,
        };
        await this.local.put(SYNC_META_COLLECTION, metaRecord);
    }
    /**
     * Triggers an immediate bidirectional sync cycle
     */
    async syncNow() {
        if (this.isSyncing) {
            return this.getStats('syncing');
        }
        const online = await this.monitor.probe();
        if (!online) {
            this.emit('sync:skipped', { reason: 'offline' });
            return this.getStats('offline');
        }
        this.isSyncing = true;
        this.emit('sync:start', { timestamp: Date.now() });
        try {
            // 1. Pull Phase: Fetch remote changes made since last sync
            await this.pullPhase();
            // 2. Push Phase: Process and flush local mutation queue
            await this.pushPhase();
            // 3. Update Sync Timestamp
            const now = Date.now();
            await this.saveLastSyncTimestamp(now);
            this.emit('sync:complete', {
                timestamp: now,
                syncedCount: this.totalSyncedCount,
                conflictCount: this.totalConflictCount,
            });
            return this.getStats('idle');
        }
        catch (err) {
            this.emit('sync:error', { error: err.message || err });
            return this.getStats('error');
        }
        finally {
            this.isSyncing = false;
        }
    }
    /**
     * Pull Phase: Reconciles remote delta changes into local store
     */
    async pullPhase() {
        if (!this.remote.fetchChangesSince)
            return;
        const sinceTs = this.lastSyncTimestamp || 0;
        for (const collection of Array.from(this.collectionsToSync)) {
            try {
                const remoteChanges = await this.remote.fetchChangesSince(collection, sinceTs);
                for (const remoteRec of remoteChanges) {
                    const localRec = await this.local.get(collection, remoteRec._id);
                    if (!localRec) {
                        // New record from server
                        remoteRec._synced = true;
                        await this.local.put(collection, remoteRec);
                        this.totalSyncedCount++;
                        continue;
                    }
                    // Conflict Detection: If local has unsynced modifications
                    if (!localRec._synced && localRec._updatedAt !== remoteRec._updatedAt) {
                        this.totalConflictCount++;
                        const timeDiff = Math.abs((localRec._updatedAt || 0) - (remoteRec._updatedAt || 0));
                        const resolution = await this.resolver.resolve({
                            collection,
                            recordId: remoteRec._id,
                            localRecord: localRec,
                            remoteRecord: remoteRec,
                            timeDifferenceMs: timeDiff,
                        });
                        this.emit('sync:conflict', {
                            collection,
                            recordId: remoteRec._id,
                            action: resolution.action,
                            strategy: resolution.strategyUsed,
                        });
                        if (resolution.action === 'accept_remote') {
                            await this.local.put(collection, resolution.resolvedRecord);
                        }
                        else if (resolution.action === 'merged') {
                            await this.local.put(collection, resolution.resolvedRecord);
                            // Re-queue merged record to sync to remote
                            await this.queue.enqueue(collection, 'update', remoteRec._id, resolution.resolvedRecord);
                        }
                        // If 'keep_local', mutation remains in queue to push
                    }
                    else {
                        // Local is untouched or already synced; update local with newer server record
                        if ((remoteRec._updatedAt || 0) >= (localRec._updatedAt || 0)) {
                            remoteRec._synced = true;
                            await this.local.put(collection, remoteRec);
                            this.totalSyncedCount++;
                        }
                    }
                }
            }
            catch (err) {
                console.warn(`[db-manager] Pull error on collection "${collection}":`, err);
            }
        }
    }
    /**
     * Push Phase: Drains local mutation queue and writes to remote backend
     */
    async pushPhase() {
        const items = await this.queue.getAll();
        for (const item of items) {
            if (item.retryCount >= this.config.maxRetries) {
                // Exceeded retries; emit warning and skip or re-evaluate
                this.emit('sync:item_failed', { item, reason: 'max_retries_exceeded' });
                continue;
            }
            try {
                if (item.action === 'insert') {
                    const localRecord = await this.local.get(item.collection, item.recordId);
                    if (localRecord && !localRecord._deleted) {
                        await this.remote.insert(item.collection, localRecord);
                        localRecord._synced = true;
                        await this.local.put(item.collection, localRecord);
                    }
                }
                else if (item.action === 'update') {
                    const localRecord = await this.local.get(item.collection, item.recordId);
                    if (localRecord) {
                        await this.remote.update(item.collection, item.recordId, localRecord);
                        localRecord._synced = true;
                        await this.local.put(item.collection, localRecord);
                    }
                }
                else if (item.action === 'delete') {
                    await this.remote.delete(item.collection, item.recordId);
                }
                // Successfully executed on remote: dequeue from local queue
                await this.queue.dequeue(item.id);
                this.totalSyncedCount++;
            }
            catch (err) {
                await this.queue.recordFailure(item.id, err.message || String(err));
                this.emit('sync:item_retry', { item, error: err.message });
            }
        }
    }
    async getStats(overrideStatus) {
        const pending = await this.queue.count();
        let status = 'idle';
        if (overrideStatus) {
            status = overrideStatus;
        }
        else if (this.isSyncing) {
            status = 'syncing';
        }
        else if (!this.monitor.isOnline()) {
            status = 'offline';
        }
        return {
            pendingCount: pending,
            totalSynced: this.totalSyncedCount,
            totalConflicts: this.totalConflictCount,
            lastSyncTimestamp: this.lastSyncTimestamp,
            status,
        };
    }
}
exports.SyncEngine = SyncEngine;
const LAST_KEY = LAST_SYNC_KEY;
//# sourceMappingURL=sync-engine.js.map