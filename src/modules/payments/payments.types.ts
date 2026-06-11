export type PaymentMethod = 'cash' | 'bank_transfer' | 'pix' | 'credit_card' | 'other';

export interface Payment {
  id: string;
  tenantId: string;
  receiptId: string;
  paymentDate: Date;
  amount: number;
  method: PaymentMethod;
  methodDescription?: string | null;
  createdAt: Date;
}

export interface CreatePaymentDto {
  tenantId: string;
  receiptId: string;
  paymentDate: Date;
  amount: number;
  method: PaymentMethod;
  methodDescription?: string | null;
}

export interface ListPaymentsFilters {
  tenantId: string;
  receiptId?: string;
}

export interface PaymentSummary {
  receiptId: string;
  receiptAmount: number;
  totalPaid: number;
  balance: number;
  isFullyPaid: boolean;
  payments: Payment[];
}
