/**
 * db-manager - Local Storage Module
 */
export * from './local-adapter.interface';
export * from './memory-storage-adapter';
export * from './indexeddb-adapter';
export * from './file-storage-adapter';
import { ILocalAdapter } from './local-adapter.interface';
export declare function autoDetectLocalAdapter(dbName?: string): ILocalAdapter;
//# sourceMappingURL=index.d.ts.map