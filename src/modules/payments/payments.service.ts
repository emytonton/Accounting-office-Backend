import { IPaymentsRepository } from './payments.repository';
import { IReceiptsRepository } from '../receipts/receipts.repository';
import { IAuditRepository } from '../audit/audit.repository';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentDto, ListPaymentsFilters, Payment, PaymentSummary } from './payments.types';
import { AppError } from '../../shared/errors/AppError';

export class PaymentsService {
  private readonly auditService: AuditService;

  constructor(
    private readonly repository: IPaymentsRepository,
    private readonly receiptsRepository: IReceiptsRepository,
    private readonly auditRepository: IAuditRepository,
  ) {
    this.auditService = new AuditService(auditRepository);
  }

  async findAll(filters: ListPaymentsFilters): Promise<Payment[]> {
    return this.repository.findAll(filters);
  }

  async findById(tenantId: string, id: string): Promise<Payment> {
    const payment = await this.repository.findById(tenantId, id);
    if (!payment) throw new AppError('Payment not found', 404, 'NOT_FOUND');
    return payment;
  }

  /// US-H03a/b: registra pagamento com validacao RN-007 e baixa automatica.
  async create(dto: CreatePaymentDto, actorId: string): Promise<Payment> {
    const receipt = await this.receiptsRepository.findById(dto.tenantId, dto.receiptId);
    if (!receipt) throw new AppError('Receipt not found', 404, 'NOT_FOUND');
    if (receipt.status === 'cancelled') {
      throw new AppError('Cannot register payment on cancelled receipt', 409, 'RECEIPT_CANCELLED');
    }

    // RN-007: soma dos pagamentos nao pode exceder o valor do recibo
    const currentSum = await this.repository.sumByReceipt(dto.tenantId, dto.receiptId);
    if (currentSum + dto.amount > receipt.amount) {
      throw new AppError(
        `Payment would exceed receipt balance. Balance: ${receipt.amount - currentSum}`,
        409,
        'PAYMENT_EXCEEDS_BALANCE',
      );
    }

    const payment = await this.repository.create(dto);

    // RN-008: baixa automatica quando total pago atinge o valor do recibo
    const newTotal = currentSum + dto.amount;
    if (newTotal >= receipt.amount) {
      await this.receiptsRepository.setPaidAt(dto.tenantId, dto.receiptId, new Date());
    }

    await this.auditService.log({
      tenantId: dto.tenantId,
      userId: actorId,
      action: 'payment.created',
      entity: 'payment',
      entityId: payment.id,
      metadata: {
        receiptId: dto.receiptId,
        amount: dto.amount,
        method: dto.method,
        totalPaid: newTotal,
        autoBaixa: newTotal >= receipt.amount,
      },
    });

    return payment;
  }

  /// US-H03c: historico de pagamentos de um recibo com saldo consolidado.
  async getSummary(tenantId: string, receiptId: string): Promise<PaymentSummary> {
    const receipt = await this.receiptsRepository.findById(tenantId, receiptId);
    if (!receipt) throw new AppError('Receipt not found', 404, 'NOT_FOUND');

    const payments = await this.repository.findAll({ tenantId, receiptId });
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

    return {
      receiptId,
      receiptAmount: receipt.amount,
      totalPaid,
      balance: receipt.amount - totalPaid,
      isFullyPaid: totalPaid >= receipt.amount,
      payments,
    };
  }
}
