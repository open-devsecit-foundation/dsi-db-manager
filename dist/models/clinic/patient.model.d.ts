/**
 * db-manager - Patient Model
 */
import { BaseModel } from '../base-model';
export interface Patient extends BaseModel {
    clinicId: string;
    patientCode: string;
    fullName: string;
    email?: string;
    phone: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    address?: string;
    city?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    medicalHistory?: string[];
    allergies?: string[];
    notes?: string;
    avatar?: string;
    isActive: boolean;
}
//# sourceMappingURL=patient.model.d.ts.map