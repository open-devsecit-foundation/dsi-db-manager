"use strict";
/**
 * db-manager - Local Storage Module
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
exports.autoDetectLocalAdapter = autoDetectLocalAdapter;
__exportStar(require("./local-adapter.interface"), exports);
__exportStar(require("./memory-storage-adapter"), exports);
__exportStar(require("./indexeddb-adapter"), exports);
__exportStar(require("./file-storage-adapter"), exports);
const indexeddb_adapter_1 = require("./indexeddb-adapter");
const file_storage_adapter_1 = require("./file-storage-adapter");
const memory_storage_adapter_1 = require("./memory-storage-adapter");
function autoDetectLocalAdapter(dbName = 'db_manager') {
    if (typeof window !== 'undefined' && window.indexedDB) {
        return new indexeddb_adapter_1.IndexedDbAdapter({ dbName });
    }
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        return new file_storage_adapter_1.FileStorageAdapter({ dataDir: `./.db-manager-data/${dbName}` });
    }
    return new memory_storage_adapter_1.MemoryStorageAdapter();
}
//# sourceMappingURL=index.js.map