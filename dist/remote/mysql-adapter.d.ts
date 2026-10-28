/**
 * db-manager - Direct MySQL Remote Adapter
 * Supports direct MySQL connection via mysql2 (Node.js/Electron) or HTTP MySQL Bridge.
 */
import { IRemoteAdapter } from './remote-adapter.interface';
import { BackendType, DbRecord, QueryFilter, QueryOptions } from '../core/types';
export interface MysqlConfig {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database: string;
    httpBridgeUrl?: string;
}
export declare class MysqlAdapter implements IRemoteAdapter {
    name: string;
    type: BackendType;
    private host;
    private port;
    private user;
    private password;
    private database;
    private httpBridgeUrl?;
    private connectionPool;
    private initializedTables;
    constructor(config: MysqlConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private execute;
    ping(): Promise<boolean>;
    private ensureTable;
    get<T = any>(collection: string, id: string): Promise<DbRecord<T> | null>;
    find<T = any>(collection: string, filter?: QueryFilter, options?: QueryOptions): Promise<DbRecord<T>[]>;
    insert<T = any>(collection: string, record: DbRecord<T>): Promise<DbRecord<T>>;
    update<T = any>(collection: string, id: string, record: Partial<DbRecord<T>>): Promise<DbRecord<T>>;
    delete(collection: string, id: string): Promise<boolean>;
    fetchChangesSince<T = any>(collection: string, timestampMs: number): Promise<DbRecord<T>[]>;
}
//# sourceMappingURL=mysql-adapter.d.ts.map