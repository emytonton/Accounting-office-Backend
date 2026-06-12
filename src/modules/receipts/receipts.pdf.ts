import PDFDocument from 'pdfkit';
import { Receipt } from './receipts.types';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export interface CompanyForPdf {
  name: string;
  cnpj: string;
}

export interface GeneratePdfOptions {
  isSecondCopy?: boolean;
}

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5',
  );
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('pt-BR');
}

function receiptNumber(receipt: Receipt): string {
  const padded = String(receipt.number).padStart(4, '0');
  return `${padded}/${receipt.year}`;
}

/// Gera o PDF do recibo. Resolve com o Buffer completo.
export function generateReceiptPdf(
  receipt: Receipt,
  company: CompanyForPdf,
  opts: GeneratePdfOptions = {},
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Cabecalho "2a VIA" em vermelho quando for copia
    if (opts.isSecondCopy) {
      doc
        .fontSize(14)
        .fillColor('#C0392B')
        .font('Helvetica-Bold')
        .text('2ª VIA', { align: 'right' });
      doc.moveDown(0.5);
    }

    // Titulo
    doc
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('RECIBO DE HONORÁRIOS', { align: 'center' });

    doc.moveDown(0.3);
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#666666')
      .text(`Nº ${receiptNumber(receipt)}`, { align: 'center' });

    if (receipt.status === 'cancelled') {
      doc.moveDown(0.5);
      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor('#C0392B')
        .text('CANCELADO', { align: 'center' });
      if (receipt.cancelReason) {
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#666666')
          .text(`Motivo: ${receipt.cancelReason}`, { align: 'center' });
      }
    }

    doc.moveDown(1.5);

    // Valor em destaque
    doc
      .fillColor('#000000')
      .font('Helvetica-Bold')
      .fontSize(28)
      .text(formatCurrency(receipt.amount), { align: 'center' });

    doc.moveDown(1.5);

    // Corpo do recibo
    doc.font('Helvetica').fontSize(12).fillColor('#000000');
    const competenceLabel = `${MONTHS_PT[receipt.competenceMonth - 1]}/${receipt.competenceYear}`;
    const body =
      `Recebemos de ${company.name}, inscrita no CNPJ sob o nº ${formatCnpj(company.cnpj)}, ` +
      `a importância de ${formatCurrency(receipt.amount)} ` +
      `referente aos honorários contábeis da competência ${competenceLabel}.`;
    doc.text(body, { align: 'justify', lineGap: 4 });

    doc.moveDown(2);

    // Rodape
    doc
      .fontSize(11)
      .fillColor('#444444')
      .text(`Data de emissão: ${formatDate(receipt.createdAt)}`);

    doc.moveDown(3);

    // Linha de assinatura
    const sigY = doc.y;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const lineWidth = 240;
    const lineX = doc.page.margins.left + (pageWidth - lineWidth) / 2;

    doc
      .moveTo(lineX, sigY)
      .lineTo(lineX + lineWidth, sigY)
      .strokeColor('#333333')
      .stroke();

    doc
      .fontSize(10)
      .fillColor('#666666')
      .text('Assinatura', lineX, sigY + 6, { width: lineWidth, align: 'center' });

    // Marca discreta na 2a via no rodape tambem
    if (opts.isSecondCopy) {
      const bottomY = doc.page.height - doc.page.margins.bottom - 20;
      doc
        .fontSize(9)
        .fillColor('#999999')
        .text(
          'Documento emitido como 2ª via do recibo original.',
          doc.page.margins.left,
          bottomY,
          { width: pageWidth, align: 'center' },
        );
    }

    doc.end();
  });
}
