/**
 * db-manager - Appointment Model
 */
import { BaseModel } from '../base-model';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
export type AppointmentType = 'consultation' | 'follow-up' | 'emergency' | 'routine-check' | 'vaccination';
export interface Appointment extends BaseModel {
    clinicId: string;
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    durationMinutes: number;
    status: AppointmentStatus;
    type: AppointmentType;
    reason: string;
    notes?: string;
    createdBy?: string;
}
//# sourceMappingURL=appointment.model.d.ts.map