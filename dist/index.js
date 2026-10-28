"use strict";
/**
 * db-manager
 * Enterprise-grade offline-first database manager with dual local/server sync,
 * millisecond conflict resolution, and multi-backend support.
 *
 * Backends: DSIAPI, Supabase, Firebase RTDB, Firestore, Neon, Direct MySQL, MongoDB.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalEventEmitter = exports.Collection = exports.DbManager = void 0;
// Core Exports
var db_manager_1 = require("./core/db-manager");
Object.defineProperty(exports, "DbManager", { enumerable: true, get: function () { return db_manager_1.DbManager; } });
var collection_1 = require("./core/collection");
Object.defineProperty(exports, "Collection", { enumerable: true, get: function () { return collection_1.Collection; } });
var events_1 = require("./core/events");
Object.defineProperty(exports, "UniversalEventEmitter", { enumerable: true, get: function () { return events_1.UniversalEventEmitter; } });
__exportStar(require("./core/types"), exports);
__exportStar(require("./core/config"), exports);
// Local Storage Adapters
__exportStar(require("./local/index"), exports);
// Remote Backend Adapters
__exportStar(require("./remote/index"), exports);
// Sync, Conflict & Network System
__exportStar(require("./sync/index"), exports);
// Pre-Built Healthcare & SaaS Models
__exportStar(require("./models/index"), exports);
//# sourceMappingURL=index.js.map