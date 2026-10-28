/**
 * db-manager - Generic Document Model (Flexible Schema-less JSON)
 */
import { BaseModel } from '../base-model';
export interface GenericDocument extends BaseModel {
    data: Record<string, any>;
    tags?: string[];
    ownerId?: string;
}
//# sourceMappingURL=generic-document.model.d.ts.map