import { Receipt } from './receipts.types';

export class ReceiptsService {
  async findAll(_tenantId: string): Promise<Receipt[]> {
    // TODO: query database
    // Receipts have sequential numbering per tenant and civil year
    // Cancelled receipts are not valid as proof of payment
    return [];
  }
}
