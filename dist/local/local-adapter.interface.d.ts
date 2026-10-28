/**
 * db-manager - Local Adapter Interface
 */
import { DbRecord, QueryFilter, QueryOptions } from '../core/types';
export interface ILocalAdapter {
    name: string;
    init(): Promise<void>;
    close(): Promise<void>;
    get<T = any>(collection: string, id: string): Promise<DbRecord<T> | null>;
    find<T = any>(collection: string, filter?: QueryFilter, options?: QueryOptions): Promise<DbRecord<T>[]>;
    put<T = any>(collection: string, record: DbRecord<T>): Promise<DbRecord<T>>;
    putBatch<T = any>(collection: string, records: DbRecord<T>[]): Promise<DbRecord<T>[]>;
    delete(collection: string, id: string, softDelete?: boolean): Promise<boolean>;
    clear(collection: string): Promise<void>;
    listCollections(): Promise<string[]>;
}
//# sourceMappingURL=local-adapter.interface.d.ts.map