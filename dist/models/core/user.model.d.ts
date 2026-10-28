/**
 * db-manager - User Model
 */
import { BaseModel } from '../base-model';
export type UserRole = 'superadmin' | 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'pharmacist' | 'accountant' | 'patient' | 'staff';
export interface User extends BaseModel {
    email: string;
    fullName: string;
    phone?: string;
    avatar?: string;
    role: UserRole;
    clinicId?: string;
    department?: string;
    isActive: boolean;
    lastLogin?: number;
}
//# sourceMappingURL=user.model.d.ts.map