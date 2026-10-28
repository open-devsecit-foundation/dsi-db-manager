/**
 * db-manager - Neon Serverless Postgres Remote Adapter
 * Operates over Neon Serverless HTTP SQL API or PostgreSQL gateway.
 */
import { IRemoteAdapter } from './remote-adapter.interface';
import { BackendType, DbRecord, QueryFilter, QueryOptions } from '../core/types';
export interface NeonConfig {
    connectionString?: string;
    host?: string;
    database?: string;
    user?: string;
    password?: string;
}
export declare class NeonAdapter implements IRemoteAdapter {
    name: string;
    type: BackendType;
    private host;
    private user;
    private password;
    private database;
    private initializedTables;
    constructor(config: NeonConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    /**
     * Executes SQL via Neon's HTTP SQL gateway
     */
    private query;
    ping(): Promise<boolean>;
    private ensureTable;
    get<T = any>(collection: string, id: string): Promise<DbRecord<T> | null>;
    find<T = any>(collection: string, filter?: QueryFilter, options?: QueryOptions): Promise<DbRecord<T>[]>;
    insert<T = any>(collection: string, record: DbRecord<T>): Promise<DbRecord<T>>;
    update<T = any>(collection: string, id: string, record: Partial<DbRecord<T>>): Promise<DbRecord<T>>;
    delete(collection: string, id: string): Promise<boolean>;
    fetchChangesSince<T = any>(collection: string, timestampMs: number): Promise<DbRecord<T>[]>;
}
//# sourceMappingURL=neon-adapter.d.ts.map