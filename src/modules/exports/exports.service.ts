import { IDemandsRepository } from '../demands/demands.repository';
import { IPaymentsRepository } from '../payments/payments.repository';
import { ICompaniesRepository } from '../companies/companies.repository';
import { IDemandTypesRepository } from '../demand-types/demand-types.repository';
import { IReceiptsRepository } from '../receipts/receipts.repository';

function csvRow(values: (string | number | boolean | null | undefined)[]): string {
  return values
    .map((v) => {
      if (v === null || v === undefined) return '';
      const str = String(v);
      return str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    })
    .join(',');
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluída',
  overdue: 'Atrasada',
};

const SECTOR_LABELS: Record<string, string> = {
  Fiscal: 'Fiscal',
  DP: 'Pessoal',
  'Contábil': 'Contábil',
};

const METHOD_LABELS: Record<string, string> = {
  cash: 'Dinheiro',
  bank_transfer: 'Transferência Bancária',
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  other: 'Outro',
};

function competence(month?: number, year?: number): string {
  if (!month || !year) return '';
  return `${MONTHS[month - 1] ?? month}/${year}`;
}

function formatDate(d?: Date | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('pt-BR');
}

function formatMoney(v: number): string {
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export class ExportsService {
  constructor(
    private readonly demandsRepository: IDemandsRepository,
    private readonly paymentsRepository: IPaymentsRepository,
    private readonly companiesRepository: ICompaniesRepository,
    private readonly demandTypesRepository: IDemandTypesRepository,
    private readonly receiptsRepository: IReceiptsRepository,
  ) {}

  async generateDemandsCsv(
    tenantId: string,
    filters: { competenceMonth?: number; competenceYear?: number; companyId?: string },
  ): Promise<string> {
    const [demands, companiesResult, demandTypes] = await Promise.all([
      this.demandsRepository.findAll({ tenantId, ...filters }),
      this.companiesRepository.findAll({ tenantId, limit: 1000 }),
      this.demandTypesRepository.findAll({ tenantId }),
    ]);

    const companyById = new Map(companiesResult.items.map((c) => [c.id, c]));
    const typeById = new Map(demandTypes.map((t) => [t.id, t]));

    const header = csvRow([
      'Empresa', 'Tipo de Demanda', 'Setor', 'Competência',
      'Status', 'Vencimento', 'Concluída em', 'Atrasada', 'Criada em',
    ]);

    const rows = demands.map((d) => {
      const type = typeById.get(d.demandTypeId);
      const sector = type?.sector ?? '';
      return csvRow([
        companyById.get(d.companyId)?.name ?? d.companyId,
        type?.name ?? d.demandTypeId,
        SECTOR_LABELS[sector] ?? sector,
        competence(d.competenceMonth, d.competenceYear),
        STATUS_LABELS[d.status] ?? d.status,
        formatDate(d.dueDate),
        formatDate(d.completedAt),
        d.isOverdue ? 'Sim' : 'Não',
        formatDate(d.createdAt),
      ]);
    });

    return [header, ...rows].join('\n');
  }

  async generatePaymentsCsv(
    tenantId: string,
    filters: { receiptId?: string },
  ): Promise<string> {
    const [payments, receipts, companiesResult] = await Promise.all([
      this.paymentsRepository.findAll({ tenantId, ...filters }),
      this.receiptsRepository.findAll({ tenantId }),
      this.companiesRepository.findAll({ tenantId, limit: 1000 }),
    ]);

    const receiptById = new Map(receipts.map((r) => [r.id, r]));
    const companyById = new Map(companiesResult.items.map((c) => [c.id, c]));

    const header = csvRow([
      'Recibo Nº', 'Empresa', 'Competência', 'Data do Pagamento',
      'Valor', 'Forma de Pagamento', 'Descrição', 'Registrado em',
    ]);

    const rows = payments.map((p) => {
      const receipt = receiptById.get(p.receiptId);
      const company = receipt ? companyById.get(receipt.companyId) : undefined;
      return csvRow([
        receipt ? `#${receipt.number}` : p.receiptId,
        company?.name ?? '',
        receipt ? competence(receipt.competenceMonth, receipt.competenceYear) : '',
        formatDate(p.paymentDate),
        formatMoney(p.amount),
        METHOD_LABELS[p.method] ?? p.method,
        p.methodDescription ?? '',
        formatDate(p.createdAt),
      ]);
    });

    return [header, ...rows].join('\n');
  }
}
