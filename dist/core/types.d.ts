/**
 * db-manager - Core Types and Interfaces
 */
export interface SyncMetadata {
    _id: string;
    _version: number;
    _createdAt: number;
    _updatedAt: number;
    _deleted: boolean;
    _synced: boolean;
    _lastSyncedAt?: number;
}
export type DbRecord<T = Record<string, any>> = T & SyncMetadata;
export type SyncAction = 'insert' | 'update' | 'delete';
export interface SyncQueueItem {
    id: string;
    collection: string;
    action: SyncAction;
    recordId: string;
    data?: any;
    timestamp: number;
    retryCount: number;
    lastError?: string;
}
export type ConflictStrategy = 'last-write-wins' | 'server-wins' | 'client-wins' | 'field-merge' | 'manual';
export interface ConflictContext<T = any> {
    collection: string;
    recordId: string;
    localRecord: DbRecord<T>;
    remoteRecord: DbRecord<T>;
    timeDifferenceMs: number;
}
export interface ConflictResolution<T = any> {
    resolvedRecord: DbRecord<T>;
    action: 'keep_local' | 'accept_remote' | 'merged';
    strategyUsed: ConflictStrategy;
}
export type CustomConflictResolver<T = any> = (context: ConflictContext<T>) => Promise<ConflictResolution<T>> | ConflictResolution<T>;
export type QueryFilter = Record<string, any>;
export interface QueryOptions {
    limit?: number;
    offset?: number;
    sort?: Record<string, 'asc' | 'desc'>;
    includeDeleted?: boolean;
}
export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';
export type BackendType = 'dsiapi' | 'supabase' | 'firebase-rtdb' | 'firestore' | 'neon' | 'mysql' | 'mongodb' | 'custom';
export interface SyncStats {
    pendingCount: number;
    totalSynced: number;
    totalConflicts: number;
    lastSyncTimestamp: number | null;
    status: SyncStatus;
}
//# sourceMappingURL=types.d.ts.map