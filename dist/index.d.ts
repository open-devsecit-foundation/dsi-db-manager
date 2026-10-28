/**
 * db-manager
 * Enterprise-grade offline-first database manager with dual local/server sync,
 * millisecond conflict resolution, and multi-backend support.
 *
 * Backends: DSIAPI, Supabase, Firebase RTDB, Firestore, Neon, Direct MySQL, MongoDB.
 */
export { DbManager } from './core/db-manager';
export { Collection } from './core/collection';
export { UniversalEventEmitter } from './core/events';
export * from './core/types';
export * from './core/config';
export * from './local/index';
export * from './remote/index';
export * from './sync/index';
export * from './models/index';
//# sourceMappingURL=index.d.ts.map