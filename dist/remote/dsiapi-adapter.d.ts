/**
 * db-manager - DSIAPI Remote Adapter
 * Integrates directly with DevSecIt Rust API Engine (v1.0.0 High-Performance Dual Engine).
 */
import { IRemoteAdapter } from './remote-adapter.interface';
import { BackendType, DbRecord, QueryFilter, QueryOptions } from '../core/types';
export interface DsiApiConfig {
    endpoint?: string;
    token?: string;
    credentials?: {
        dbName: string;
        dbPass: string;
        user?: string;
        expiryDays?: number;
        driver?: 'mysql' | 'pgsql';
    };
}
export declare class DsiApiAdapter implements IRemoteAdapter {
    name: string;
    type: BackendType;
    private endpoint;
    private token;
    private credentials?;
    private tokenExpiryTime;
    constructor(config?: DsiApiConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    ping(): Promise<boolean>;
    /**
     * Auto-generate authentication token via DSIAPI's /gen_token endpoint
     */
    private generateToken;
    private ensureToken;
    /**
     * Dispatches requests to DSIAPI Gateway (POST /)
     */
    private request;
    get<T = any>(collection: string, id: string): Promise<DbRecord<T> | null>;
    find<T = any>(collection: string, filter?: QueryFilter, options?: QueryOptions): Promise<DbRecord<T>[]>;
    insert<T = any>(collection: string, record: DbRecord<T>): Promise<DbRecord<T>>;
    update<T = any>(collection: string, id: string, record: Partial<DbRecord<T>>): Promise<DbRecord<T>>;
    delete(collection: string, id: string): Promise<boolean>;
    fetchChangesSince<T = any>(collection: string, timestampMs: number): Promise<DbRecord<T>[]>;
    /**
     * Serializes nested objects/arrays to JSON strings for DSIAPI SQL columns
     */
    private serializeRecord;
    /**
     * Deserializes JSON string columns back to objects
     */
    private deserializeRecord;
}
//# sourceMappingURL=dsiapi-adapter.d.ts.map