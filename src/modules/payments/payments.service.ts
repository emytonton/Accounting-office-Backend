import { Payment } from './payments.types';

export class PaymentsService {
  async findAll(_tenantId: string): Promise<Payment[]> {
    // TODO: query database
    // Payments must be linked to a valid receipt
    // Sum of payments cannot exceed the receipt amount
    // Partial payments are allowed
    // Payment method is required; if 'other', methodDescription is required
    return [];
  }
}
