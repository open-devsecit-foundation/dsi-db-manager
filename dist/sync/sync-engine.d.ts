/**
 * db-manager - Bidirectional Sync Engine
 */
import { UniversalEventEmitter } from '../core/events';
import { ILocalAdapter } from '../local/local-adapter.interface';
import { IRemoteAdapter } from '../remote/remote-adapter.interface';
import { SyncQueue } from './sync-queue';
import { NetworkMonitor } from './network-monitor';
import { ConflictResolver } from './conflict-resolver';
import { SyncConfig } from '../core/config';
import { SyncStats, SyncStatus } from '../core/types';
export declare class SyncEngine extends UniversalEventEmitter {
    private local;
    private remote;
    private queue;
    private monitor;
    private resolver;
    private config;
    private isSyncing;
    private syncTimer;
    private totalSyncedCount;
    private totalConflictCount;
    private lastSyncTimestamp;
    private collectionsToSync;
    constructor(local: ILocalAdapter, remote: IRemoteAdapter, config?: SyncConfig);
    private setupListeners;
    registerCollection(collection: string): void;
    getQueue(): SyncQueue;
    getNetworkMonitor(): NetworkMonitor;
    getConflictResolver(): ConflictResolver;
    start(): Promise<void>;
    stop(): void;
    private loadLastSyncTimestamp;
    private saveLastSyncTimestamp;
    /**
     * Triggers an immediate bidirectional sync cycle
     */
    syncNow(): Promise<SyncStats>;
    /**
     * Pull Phase: Reconciles remote delta changes into local store
     */
    private pullPhase;
    /**
     * Push Phase: Drains local mutation queue and writes to remote backend
     */
    private pushPhase;
    getStats(overrideStatus?: SyncStatus): Promise<SyncStats>;
}
//# sourceMappingURL=sync-engine.d.ts.map