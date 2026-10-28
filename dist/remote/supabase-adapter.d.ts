/**
 * db-manager - Supabase Remote Adapter
 * Communicates with Supabase PostgREST endpoint natively.
 */
import { IRemoteAdapter } from './remote-adapter.interface';
import { BackendType, DbRecord, QueryFilter, QueryOptions } from '../core/types';
export interface SupabaseConfig {
    supabaseUrl: string;
    supabaseKey: string;
    schema?: string;
}
export declare class SupabaseAdapter implements IRemoteAdapter {
    name: string;
    type: BackendType;
    private url;
    private key;
    private schema;
    constructor(config: SupabaseConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    ping(): Promise<boolean>;
    private getHeaders;
    get<T = any>(collection: string, id: string): Promise<DbRecord<T> | null>;
    find<T = any>(collection: string, filter?: QueryFilter, options?: QueryOptions): Promise<DbRecord<T>[]>;
    insert<T = any>(collection: string, record: DbRecord<T>): Promise<DbRecord<T>>;
    update<T = any>(collection: string, id: string, record: Partial<DbRecord<T>>): Promise<DbRecord<T>>;
    delete(collection: string, id: string): Promise<boolean>;
    fetchChangesSince<T = any>(collection: string, timestampMs: number): Promise<DbRecord<T>[]>;
}
//# sourceMappingURL=supabase-adapter.d.ts.map