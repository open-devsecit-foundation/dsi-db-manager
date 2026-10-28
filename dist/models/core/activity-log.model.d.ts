/**
 * db-manager - Activity Log / Audit Trail Model
 */
import { BaseModel } from '../base-model';
export interface ActivityLog extends BaseModel {
    clinicId?: string;
    userId?: string;
    userName?: string;
    action: string;
    entity: string;
    entityId?: string;
    changes?: Record<string, any>;
    ip?: string;
    userAgent?: string;
}
//# sourceMappingURL=activity-log.model.d.ts.map