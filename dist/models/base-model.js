"use strict";
/**
 * db-manager - Base Entity Model
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBaseEntity = createBaseEntity;
function createBaseEntity(partial) {
    const now = Date.now();
    return {
        _id: partial?._id || generateEntityId(),
        _version: partial?._version || 1,
        _createdAt: partial?._createdAt || now,
        _updatedAt: partial?._updatedAt || now,
        _deleted: partial?._deleted || false,
        _synced: partial?._synced || false,
        _lastSyncedAt: partial?._lastSyncedAt,
    };
}
function generateEntityId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'ent_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
}
//# sourceMappingURL=base-model.js.map