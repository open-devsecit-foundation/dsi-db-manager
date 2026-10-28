/**
 * db-manager - Base Entity Model
 */
import { SyncMetadata } from '../core/types';
export interface BaseModel extends SyncMetadata {
    _id: string;
    _version: number;
    _createdAt: number;
    _updatedAt: number;
    _deleted: boolean;
    _synced: boolean;
    _lastSyncedAt?: number;
}
export declare function createBaseEntity(partial?: Partial<BaseModel>): BaseModel;
//# sourceMappingURL=base-model.d.ts.map