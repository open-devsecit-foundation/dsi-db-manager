"use strict";
/**
 * db-manager - Configuration Options
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SYNC_CONFIG = void 0;
exports.DEFAULT_SYNC_CONFIG = {
    autoSyncOnOnline: true,
    syncIntervalMs: 15000,
    maxRetries: 5,
    retryDelayMs: 1000,
    conflictStrategy: 'last-write-wins',
    heartbeatIntervalMs: 10000,
    onConflict: undefined,
    heartbeatUrl: undefined,
};
//# sourceMappingURL=config.js.map