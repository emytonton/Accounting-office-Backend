export type ReceiptStatus = 'active' | 'cancelled';

export interface Receipt {
  id: string;
  tenantId: string;
  companyId: string;
  number: number;
  year: number;
  competenceMonth: number;
  competenceYear: number;
  amount: number;
  status: ReceiptStatus;
  cancelReason?: string;
  originalReceiptId?: string;
  createdAt: Date;
}

export type CreateReceiptDto = Omit<Receipt, 'id' | 'number' | 'status' | 'createdAt'>;
