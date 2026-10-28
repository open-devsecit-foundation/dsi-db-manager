/**
 * db-manager - MongoDB Remote Adapter
 * Supports MongoDB native driver (Node.js/Electron) and MongoDB Atlas Data API (REST).
 */
import { IRemoteAdapter } from './remote-adapter.interface';
import { BackendType, DbRecord, QueryFilter, QueryOptions } from '../core/types';
export interface MongoDbConfig {
    uri?: string;
    dbName: string;
    atlasDataApi?: {
        endpoint: string;
        apiKey: string;
        dataSource: string;
    };
}
export declare class MongoDbAdapter implements IRemoteAdapter {
    name: string;
    type: BackendType;
    private uri?;
    private dbName;
    private atlas?;
    private client;
    private db;
    constructor(config: MongoDbConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    ping(): Promise<boolean>;
    private atlasRequest;
    get<T = any>(collection: string, id: string): Promise<DbRecord<T> | null>;
    find<T = any>(collection: string, filter?: QueryFilter, options?: QueryOptions): Promise<DbRecord<T>[]>;
    insert<T = any>(collection: string, record: DbRecord<T>): Promise<DbRecord<T>>;
    update<T = any>(collection: string, id: string, record: Partial<DbRecord<T>>): Promise<DbRecord<T>>;
    delete(collection: string, id: string): Promise<boolean>;
    fetchChangesSince<T = any>(collection: string, timestampMs: number): Promise<DbRecord<T>[]>;
}
//# sourceMappingURL=mongodb-adapter.d.ts.map