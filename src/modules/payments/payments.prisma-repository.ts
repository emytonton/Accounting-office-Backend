import { prisma } from '../../lib/prisma';
import { IPaymentsRepository } from './payments.repository';

export class PrismaPaymentsRepository implements IPaymentsRepository {
  async countByReceipt(tenantId: string, receiptId: string): Promise<number> {
    return prisma.payment.count({
      where: { tenantId, receiptId },
    });
  }
}
