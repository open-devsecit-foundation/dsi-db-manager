/**
 * db-manager - Medical Record / EHR Model
 */
import { BaseModel } from '../base-model';
export interface Vitals {
    bloodPressure?: string;
    pulse?: number;
    temperature?: number;
    respiratoryRate?: number;
    spO2?: number;
    weight?: number;
    height?: number;
    bmi?: number;
}
export interface Attachment {
    name: string;
    url: string;
    type: string;
    size?: number;
}
export interface MedicalRecord extends BaseModel {
    clinicId: string;
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    type: 'clinical_note' | 'lab_report' | 'vitals' | 'discharge_summary' | 'imaging';
    vitals?: Vitals;
    symptoms?: string[];
    diagnosis?: string;
    clinicalNotes?: string;
    attachments?: Attachment[];
}
//# sourceMappingURL=medical-record.model.d.ts.map