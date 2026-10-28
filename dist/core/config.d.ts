/**
 * db-manager - Configuration Options
 */
import { ConflictStrategy, CustomConflictResolver } from './types';
import { ILocalAdapter } from '../local/local-adapter.interface';
import { IRemoteAdapter } from '../remote/remote-adapter.interface';
export interface SyncConfig {
    autoSyncOnOnline?: boolean;
    syncIntervalMs?: number;
    maxRetries?: number;
    retryDelayMs?: number;
    conflictStrategy?: ConflictStrategy;
    onConflict?: CustomConflictResolver;
    heartbeatUrl?: string;
    heartbeatIntervalMs?: number;
}
export interface DbManagerConfig {
    dbName?: string;
    local?: ILocalAdapter;
    remote?: IRemoteAdapter;
    sync?: SyncConfig;
    debug?: boolean;
}
export declare const DEFAULT_SYNC_CONFIG: Required<Omit<SyncConfig, 'onConflict' | 'heartbeatUrl'>> & {
    onConflict?: CustomConflictResolver;
    heartbeatUrl?: string;
};
//# sourceMappingURL=config.d.ts.map