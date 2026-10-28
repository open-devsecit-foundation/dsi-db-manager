/**
 * db-manager - Doctor Model
 */
import { BaseModel } from '../base-model';
export interface Doctor extends BaseModel {
    userId: string;
    clinicId: string;
    specialization: string;
    qualifications: string[];
    licenseNumber: string;
    experienceYears: number;
    consultationFee: number;
    bio?: string;
    availability?: {
        days?: string[];
        startTime?: string;
        endTime?: string;
        slotDuration?: number;
    };
    rating?: number;
    reviewCount?: number;
    isActive: boolean;
}
//# sourceMappingURL=doctor.model.d.ts.map