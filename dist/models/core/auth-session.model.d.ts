/**
 * db-manager - Auth Session Model
 */
import { BaseModel } from '../base-model';
export interface AuthSession extends BaseModel {
    userId: string;
    token: string;
    refreshToken?: string;
    expiresAt: number;
    device?: string;
    ip?: string;
    userAgent?: string;
}
//# sourceMappingURL=auth-session.model.d.ts.map