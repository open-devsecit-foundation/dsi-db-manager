/**
 * db-manager - Cloud Firestore Remote Adapter
 * Operates over Cloud Firestore v1 REST API.
 */
import { IRemoteAdapter } from './remote-adapter.interface';
import { BackendType, DbRecord, QueryFilter, QueryOptions } from '../core/types';
export interface FirestoreConfig {
    projectId: string;
    databaseId?: string;
    apiKey?: string;
    accessToken?: string;
}
export declare class FirestoreAdapter implements IRemoteAdapter {
    name: string;
    type: BackendType;
    private projectId;
    private databaseId;
    private apiKey?;
    private accessToken?;
    constructor(config: FirestoreConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    private getBaseUrl;
    private getHeaders;
    ping(): Promise<boolean>;
    get<T = any>(collection: string, id: string): Promise<DbRecord<T> | null>;
    find<T = any>(collection: string, filter?: QueryFilter, options?: QueryOptions): Promise<DbRecord<T>[]>;
    insert<T = any>(collection: string, record: DbRecord<T>): Promise<DbRecord<T>>;
    update<T = any>(collection: string, id: string, record: Partial<DbRecord<T>>): Promise<DbRecord<T>>;
    delete(collection: string, id: string): Promise<boolean>;
    fetchChangesSince<T = any>(collection: string, timestampMs: number): Promise<DbRecord<T>[]>;
    /**
     * Translates native JS record to Firestore typed fields
     */
    private recordToFirestoreFields;
    private jsValueToFirestoreValue;
    /**
     * Translates Firestore document fields to native JS record
     */
    private firestoreDocToRecord;
    private firestoreValueToJs;
}
//# sourceMappingURL=firestore-adapter.d.ts.map