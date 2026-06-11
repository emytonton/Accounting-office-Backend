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
  cancelReason?: string | null;
  originalReceiptId?: string | null;
  paidAt?: Date | null;
  createdAt: Date;
}

export interface CreateReceiptDto {
  tenantId: string;
  companyId: string;
  competenceMonth: number;
  competenceYear: number;
  amount: number;
}

export interface CancelReceiptDto {
  reason: string;
  force?: boolean;
}

export interface ListReceiptsFilters {
  tenantId: string;
  companyId?: string;
  year?: number;
  status?: ReceiptStatus;
  competenceMonth?: number;
  competenceYear?: number;
}
