/**
 * db-manager - Key-Value Cache & Settings Model
 */
import { BaseModel } from '../base-model';
export interface KeyValue<T = any> extends BaseModel {
    key: string;
    value: T;
    category?: string;
    isEncrypted?: boolean;
}
//# sourceMappingURL=key-value.model.d.ts.map