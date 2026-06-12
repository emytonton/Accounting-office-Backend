import { IReceiptsRepository } from './receipts.repository';
import { ICompaniesRepository } from '../companies/companies.repository';
import { IPaymentsRepository } from '../payments/payments.repository';
import {
  CancelReceiptDto,
  CreateReceiptDto,
  ListReceiptsFilters,
  Receipt,
} from './receipts.types';
import { AppError } from '../../shared/errors/AppError';
import { generateReceiptPdf } from './receipts.pdf';

export interface ReceiptPdfResult {
  pdf: Buffer;
  filename: string;
  receipt: Receipt;
}

export class ReceiptsService {
  constructor(
    private readonly repository: IReceiptsRepository,
    private readonly companiesRepository: ICompaniesRepository,
    private readonly paymentsRepository: IPaymentsRepository,
  ) {}

  async findAll(filters: ListReceiptsFilters): Promise<Receipt[]> {
    return this.repository.findAll(filters);
  }

  async findById(tenantId: string, id: string): Promise<Receipt> {
    const r = await this.repository.findById(tenantId, id);
    if (!r) throw new AppError('Receipt not found', 404, 'NOT_FOUND');
    return r;
  }

  /// US-H01: emite recibo com numeracao sequencial automatica (RN-005).
  async create(dto: CreateReceiptDto): Promise<Receipt> {
    if (dto.amount <= 0) {
      throw new AppError('Amount must be positive', 400, 'INVALID_AMOUNT');
    }

    const company = await this.companiesRepository.findById(dto.tenantId, dto.companyId);
    if (!company) throw new AppError('Company not found', 404, 'NOT_FOUND');
    if (!company.isActive) {
      throw new AppError(
        'Cannot issue receipt for inactive company',
        409,
        'COMPANY_INACTIVE',
      );
    }

    return this.repository.create({
      tenantId: dto.tenantId,
      companyId: dto.companyId,
      year: new Date().getFullYear(),
      competenceMonth: dto.competenceMonth,
      competenceYear: dto.competenceYear,
      amount: dto.amount,
    });
  }

  /// US-H02 cancelamento: motivo obrigatorio + verificacao de pagamentos vinculados.
  /// Se houver pagamentos e nao receber force=true, retorna 409.
  async cancel(
    tenantId: string,
    id: string,
    dto: CancelReceiptDto,
  ): Promise<{ receipt: Receipt; forced: boolean }> {
    const receipt = await this.repository.findById(tenantId, id);
    if (!receipt) throw new AppError('Receipt not found', 404, 'NOT_FOUND');
    if (receipt.status === 'cancelled') {
      throw new AppError(
        'Receipt is already cancelled',
        409,
        'RECEIPT_ALREADY_CANCELLED',
      );
    }

    const paymentsCount = await this.paymentsRepository.countByReceipt(tenantId, id);
    if (paymentsCount > 0 && !dto.force) {
      throw new AppError(
        `Receipt has ${paymentsCount} payment(s) registered. Confirm with force=true to cancel.`,
        409,
        'RECEIPT_HAS_PAYMENTS',
      );
    }

    const cancelled = await this.repository.cancel(tenantId, id, dto.reason);
    return { receipt: cancelled as Receipt, forced: paymentsCount > 0 };
  }

  /// US-H01/US-H02: gera PDF do recibo. Quando isSecondCopy=true,
  /// adiciona marcacoes de "2a VIA".
  async getPdf(
    tenantId: string,
    id: string,
    isSecondCopy: boolean,
  ): Promise<ReceiptPdfResult> {
    const receipt = await this.findById(tenantId, id);
    const company = await this.companiesRepository.findById(tenantId, receipt.companyId);
    if (!company) throw new AppError('Company not found', 404, 'NOT_FOUND');

    const pdf = await generateReceiptPdf(
      receipt,
      { name: company.name, cnpj: company.cnpj },
      { isSecondCopy },
    );

    const suffix = isSecondCopy ? '-2a-via' : '';
    const padded = String(receipt.number).padStart(4, '0');
    const filename = `recibo-${padded}-${receipt.year}${suffix}.pdf`;

    return { pdf, filename, receipt };
  }
}
