"use strict";
/**
 * db-manager - High-Precision Millisecond Conflict Resolver
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictResolver = void 0;
class ConflictResolver {
    strategy;
    customResolver;
    constructor(options) {
        this.strategy = options?.strategy || 'last-write-wins';
        this.customResolver = options?.customResolver;
    }
    setStrategy(strategy) {
        this.strategy = strategy;
    }
    setCustomResolver(resolver) {
        this.customResolver = resolver;
    }
    /**
     * Resolves a conflict between a local record and a remote record
     */
    async resolve(context) {
        const { localRecord, remoteRecord } = context;
        // 1. If custom resolver hook is provided and strategy is 'manual', run custom hook
        if (this.strategy === 'manual' && this.customResolver) {
            return await this.customResolver(context);
        }
        // 2. Client-wins strategy
        if (this.strategy === 'client-wins') {
            return {
                resolvedRecord: { ...localRecord, _synced: false },
                action: 'keep_local',
                strategyUsed: 'client-wins',
            };
        }
        // 3. Server-wins strategy
        if (this.strategy === 'server-wins') {
            return {
                resolvedRecord: { ...remoteRecord, _synced: true },
                action: 'accept_remote',
                strategyUsed: 'server-wins',
            };
        }
        // 4. Field-level merge
        if (this.strategy === 'field-merge') {
            const merged = this.mergeFields(localRecord, remoteRecord);
            return {
                resolvedRecord: merged,
                action: 'merged',
                strategyUsed: 'field-merge',
            };
        }
        // 5. Default: Last-Write-Wins (LWW) based on millisecond timestamp comparison
        const localMs = localRecord._updatedAt || 0;
        const remoteMs = remoteRecord._updatedAt || 0;
        if (remoteMs > localMs) {
            // Remote is strictly newer
            return {
                resolvedRecord: { ...remoteRecord, _synced: true },
                action: 'accept_remote',
                strategyUsed: 'last-write-wins',
            };
        }
        else if (localMs > remoteMs) {
            // Local edit is strictly newer
            return {
                resolvedRecord: { ...localRecord, _synced: false },
                action: 'keep_local',
                strategyUsed: 'last-write-wins',
            };
        }
        else {
            // Exact millisecond tie-breaker: compare version or tie-break server
            if ((remoteRecord._version || 0) > (localRecord._version || 0)) {
                return {
                    resolvedRecord: { ...remoteRecord, _synced: true },
                    action: 'accept_remote',
                    strategyUsed: 'last-write-wins',
                };
            }
            return {
                resolvedRecord: { ...localRecord, _synced: false },
                action: 'keep_local',
                strategyUsed: 'last-write-wins',
            };
        }
    }
    /**
     * Field-level merge: takes the newer field values and avoids overwriting unchanged fields
     */
    mergeFields(local, remote) {
        const isLocalNewer = (local._updatedAt || 0) >= (remote._updatedAt || 0);
        const primary = isLocalNewer ? local : remote;
        const secondary = isLocalNewer ? remote : local;
        const merged = { ...secondary, ...primary };
        // Metadata preservation
        merged._id = local._id;
        merged._createdAt = Math.min(local._createdAt || Date.now(), remote._createdAt || Date.now());
        merged._updatedAt = Math.max(local._updatedAt || Date.now(), remote._updatedAt || Date.now());
        merged._version = Math.max(local._version || 1, remote._version || 1) + 1;
        // If either side deleted it, respect tombstone
        merged._deleted = Boolean(local._deleted || remote._deleted);
        merged._synced = false; // requires remote push of merged representation
        return merged;
    }
}
exports.ConflictResolver = ConflictResolver;
//# sourceMappingURL=conflict-resolver.js.map