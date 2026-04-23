export type PaymentMethod = 'cash' | 'bank_transfer' | 'pix' | 'credit_card' | 'other';

export interface Payment {
  id: string;
  tenantId: string;
  receiptId: string;
  paymentDate: Date;
  amount: number;
  method: PaymentMethod;
  methodDescription?: string;
  createdAt: Date;
}

export type CreatePaymentDto = Omit<Payment, 'id' | 'createdAt'>;
