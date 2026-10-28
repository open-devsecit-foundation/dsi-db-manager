/**
 * db-manager - Clinic / Tenant Model
 */
import { BaseModel } from '../base-model';
export interface Clinic extends BaseModel {
    name: string;
    slug: string;
    logo?: string;
    description?: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode?: string;
    phone: string;
    email: string;
    website?: string;
    timezone: string;
    currency: string;
    subscriptionPlan?: string;
    subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'cancelled';
    ownerId?: string;
    settings?: Record<string, any>;
}
//# sourceMappingURL=clinic.model.d.ts.map