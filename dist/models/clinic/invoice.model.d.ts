/**
 * db-manager - Invoice / Billing Model
 */
import { BaseModel } from '../base-model';
export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}
export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'insurance' | 'bank_transfer' | 'online';
export interface Invoice extends BaseModel {
    clinicId: string;
    patientId: string;
    invoiceNumber: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    status: InvoiceStatus;
    paymentMethod?: PaymentMethod;
    notes?: string;
    paidAt?: number;
}
//# sourceMappingURL=invoice.model.d.ts.map