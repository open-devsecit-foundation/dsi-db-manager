/**
 * db-manager - Prescription Model
 */
import { BaseModel } from '../base-model';
export interface PrescribedMedicine {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
}
export interface Prescription extends BaseModel {
    clinicId: string;
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    diagnosis: string;
    notes?: string;
    medicines: PrescribedMedicine[];
}
//# sourceMappingURL=prescription.model.d.ts.map