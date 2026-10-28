/**
 * db-manager - Firebase Realtime Database (RTDB) Remote Adapter
 * Operates over Firebase RTDB REST API.
 */
import { IRemoteAdapter } from './remote-adapter.interface';
import { BackendType, DbRecord, QueryFilter, QueryOptions } from '../core/types';
export interface FirebaseRtdbConfig {
    databaseUrl: string;
    authToken?: string;
}
export declare class FirebaseRtdbAdapter implements IRemoteAdapter {
    name: string;
    type: BackendType;
    private baseUrl;
    private authToken?;
    constructor(config: FirebaseRtdbConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    ping(): Promise<boolean>;
    private buildUrl;
    get<T = any>(collection: string, id: string): Promise<DbRecord<T> | null>;
    find<T = any>(collection: string, filter?: QueryFilter, options?: QueryOptions): Promise<DbRecord<T>[]>;
    insert<T = any>(collection: string, record: DbRecord<T>): Promise<DbRecord<T>>;
    update<T = any>(collection: string, id: string, record: Partial<DbRecord<T>>): Promise<DbRecord<T>>;
    delete(collection: string, id: string): Promise<boolean>;
    fetchChangesSince<T = any>(collection: string, timestampMs: number): Promise<DbRecord<T>[]>;
}
//# sourceMappingURL=firebase-rtdb-adapter.d.ts.map