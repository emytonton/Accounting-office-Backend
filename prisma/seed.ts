import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ── Limpar dados anteriores ─────────────────────────────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.demand.deleteMany();
  await prisma.companyDemandTypeLink.deleteMany();
  await prisma.subtaskTemplate.deleteMany();
  await prisma.demandType.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();
  console.log('  ✓ Banco limpo');

  // ── Tenant ──────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Escritório Contábil Alpha Ltda',
      document: '12.345.678/0001-90',
      isActive: true,
    },
  });
  console.log(`  ✓ Tenant: ${tenant.name}`);

  const tId = tenant.id;

  // ── Usuários ─────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@2026', 12);
  const collabHash = await bcrypt.hash('Collab@2026', 12);

  const admin = await prisma.user.create({
    data: {
      tenantId: tId,
      name: 'Victor Veras',
      identifier: 'victorveras766@gmail.com',
      passwordHash: adminHash,
      role: 'admin',
      sector: null,
      isActive: true,
    },
  });

  const anaFiscal = await prisma.user.create({
    data: {
      tenantId: tId,
      name: 'Ana Silva',
      identifier: 'ana.silva@alpha.com.br',
      passwordHash: collabHash,
      role: 'collaborator',
      sector: 'Fiscal',
      isActive: true,
    },
  });

  const pedroDP = await prisma.user.create({
    data: {
      tenantId: tId,
      name: 'Pedro Santos',
      identifier: 'pedro.santos@alpha.com.br',
      passwordHash: collabHash,
      role: 'collaborator',
      sector: 'DP',
      isActive: true,
    },
  });

  const mariaContabil = await prisma.user.create({
    data: {
      tenantId: tId,
      name: 'Maria Oliveira',
      identifier: 'maria.oliveira@alpha.com.br',
      passwordHash: collabHash,
      role: 'collaborator',
      sector: 'Contábil',
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      tenantId: tId,
      name: 'João Ferreira',
      identifier: 'joao.ferreira@alpha.com.br',
      passwordHash: collabHash,
      role: 'collaborator',
      sector: 'Fiscal',
      isActive: false,
    },
  });

  console.log(`  ✓ Usuários: admin (${admin.identifier}), ${anaFiscal.name}, ${pedroDP.name}, ${mariaContabil.name}, 1 inativo`);

  // ── Empresas ──────────────────────────────────────────────────────────────────
  const [comercialSouza, industriaNorte, techSolutions, restaurante, construtora, farmacia, distribuidora] =
    await Promise.all([
      prisma.company.create({ data: { tenantId: tId, name: 'Comercial Souza Ltda', cnpj: '11.222.333/0001-44', sector: 'Fiscal', isActive: true } }),
      prisma.company.create({ data: { tenantId: tId, name: 'Indústria Norte S.A.', cnpj: '22.333.444/0001-55', sector: 'Fiscal', isActive: true } }),
      prisma.company.create({ data: { tenantId: tId, name: 'Tech Solutions LTDA', cnpj: '33.444.555/0001-66', sector: 'Contábil', isActive: true } }),
      prisma.company.create({ data: { tenantId: tId, name: 'Restaurante Sabor & Arte', cnpj: '44.555.666/0001-77', sector: 'DP', isActive: true } }),
      prisma.company.create({ data: { tenantId: tId, name: 'Construtora Horizonte', cnpj: '55.666.777/0001-88', sector: 'Fiscal', isActive: true } }),
      prisma.company.create({ data: { tenantId: tId, name: 'Farmácia Bem-Estar', cnpj: '66.777.888/0001-99', sector: 'Contábil', isActive: true } }),
      prisma.company.create({ data: { tenantId: tId, name: 'Distribuidora Alpha ME', cnpj: '77.888.999/0001-11', sector: 'DP', isActive: true } }),
    ]);

  await prisma.company.create({ data: { tenantId: tId, name: 'Empresa Descontinuada LTDA', cnpj: '88.999.000/0001-22', sector: 'Fiscal', isActive: false } });

  console.log(`  ✓ Empresas: 7 ativas, 1 inativa`);

  // ── Tipos de Demanda ──────────────────────────────────────────────────────────
  const spedFiscal = await prisma.demandType.create({
    data: {
      tenantId: tId,
      sector: 'Fiscal',
      name: 'SPED Fiscal',
      hasSubtasks: true,
      isActive: true,
      subtaskTemplates: {
        create: [
          { tenantId: tId, name: 'Baixar arquivos do ERP', isRequired: true, orderIndex: 1 },
          { tenantId: tId, name: 'Validar arquivo no PVA', isRequired: true, orderIndex: 2 },
          { tenantId: tId, name: 'Corrigir inconsistências', isRequired: false, orderIndex: 3 },
          { tenantId: tId, name: 'Transmitir ao SEFAZ', isRequired: true, orderIndex: 4 },
        ],
      },
    },
  });

  const dctf = await prisma.demandType.create({
    data: {
      tenantId: tId,
      sector: 'Fiscal',
      name: 'DCTF Mensal',
      hasSubtasks: false,
      isActive: true,
    },
  });

  const icms = await prisma.demandType.create({
    data: {
      tenantId: tId,
      sector: 'Fiscal',
      name: 'Apuração ICMS',
      hasSubtasks: true,
      isActive: true,
      subtaskTemplates: {
        create: [
          { tenantId: tId, name: 'Apurar créditos e débitos', isRequired: true, orderIndex: 1 },
          { tenantId: tId, name: 'Gerar guia DARE/GNRE', isRequired: true, orderIndex: 2 },
          { tenantId: tId, name: 'Confirmar pagamento', isRequired: true, orderIndex: 3 },
        ],
      },
    },
  });

  const folhaPgto = await prisma.demandType.create({
    data: {
      tenantId: tId,
      sector: 'DP',
      name: 'Folha de Pagamento',
      hasSubtasks: true,
      isActive: true,
      subtaskTemplates: {
        create: [
          { tenantId: tId, name: 'Importar ponto eletrônico', isRequired: true, orderIndex: 1 },
          { tenantId: tId, name: 'Lançar eventos variáveis', isRequired: true, orderIndex: 2 },
          { tenantId: tId, name: 'Calcular e revisar folha', isRequired: true, orderIndex: 3 },
          { tenantId: tId, name: 'Gerar holerites e FGTS', isRequired: true, orderIndex: 4 },
          { tenantId: tId, name: 'Enviar para aprovação do cliente', isRequired: false, orderIndex: 5 },
        ],
      },
    },
  });

  const esocial = await prisma.demandType.create({
    data: {
      tenantId: tId,
      sector: 'DP',
      name: 'eSocial Mensal',
      hasSubtasks: false,
      isActive: true,
    },
  });

  const balanco = await prisma.demandType.create({
    data: {
      tenantId: tId,
      sector: 'Contábil',
      name: 'Balanço Mensal',
      hasSubtasks: true,
      isActive: true,
      subtaskTemplates: {
        create: [
          { tenantId: tId, name: 'Lançamentos contábeis', isRequired: true, orderIndex: 1 },
          { tenantId: tId, name: 'Conciliação bancária', isRequired: true, orderIndex: 2 },
          { tenantId: tId, name: 'Revisão de saldos', isRequired: true, orderIndex: 3 },
          { tenantId: tId, name: 'Relatório para o cliente', isRequired: false, orderIndex: 4 },
        ],
      },
    },
  });

  const conciliacao = await prisma.demandType.create({
    data: {
      tenantId: tId,
      sector: 'Contábil',
      name: 'Conciliação de Contas',
      hasSubtasks: false,
      isActive: true,
    },
  });

  console.log(`  ✓ Tipos de demanda: SPED, DCTF, ICMS (Fiscal) | Folha, eSocial (DP) | Balanço, Conciliação (Contábil)`);

  // ── Vínculos Empresa ↔ Tipo de Demanda ────────────────────────────────────────
  const links = await Promise.all([
    // Comercial Souza — Fiscal
    prisma.companyDemandTypeLink.create({ data: { tenantId: tId, companyId: comercialSouza.id, demandTypeId: spedFiscal.id, subtasksEnabled: true, isActive: true } }),
    prisma.companyDemandTypeLink.create({ data: { tenantId: tId, companyId: comercialSouza.id, demandTypeId: dctf.id, subtasksEnabled: false, isActive: true } }),
    // Indústria Norte — Fiscal
    prisma.companyDemandTypeLink.create({ data: { tenantId: tId, companyId: industriaNorte.id, demandTypeId: spedFiscal.id, subtasksEnabled: true, isActive: true } }),
    prisma.companyDemandTypeLink.create({ data: { tenantId: tId, companyId: industriaNorte.id, demandTypeId: icms.id, subtasksEnabled: true, isActive: true } }),
    prisma.companyDemandTypeLink.create({ data: { tenantId: tId, companyId: industriaNorte.id, demandTypeId: dctf.id, subtasksEnabled: false, isActive: true } }),
    // Tech Solutions — Contábil
    prisma.companyDemandTypeLink.create({ data: { tenantId: tId, companyId: techSolutions.id, demandTypeId: balanco.id, subtasksEnabled: true, isActive: true } }),
    prisma.companyDemandTypeLink.create({ data: { tenantId: tId, companyId: techSolutions.id, demandTypeId: conciliacao.id, subtasksEnabled: false, isActive: true } }),
    // Restaurante — DP
    prisma.companyDemandTypeLink.create({ data: { tenantId: tId, companyId: restaurante.id, demandTypeId: folhaPgto.id, subtasksEnabled: true, isActive: true } }),
    prisma.companyDemandTypeLink.create({ data: { tenantId: tId, companyId: restaurante.id, demandTypeId: esocial.id, subtasksEnabled: false, isActive: true } }),
    // Construtora — Fiscal + DP
    prisma.companyDemandTypeLink.create({ data: { tenantId: tId, companyId: construtora.id, demandTypeId: dctf.id, subtasksEnabled: false, isActive: true } }),
    prisma.companyDemandTypeLink.create({ data: { tenantId: tId, companyId: construtora.id, demandTypeId: folhaPgto.id, subtasksEnabled: true, isActive: true } }),
    prisma.companyDemandTypeLink.create({ data: { tenantId: tId, companyId: construtora.id, demandTypeId: icms.id, subtasksEnabled: true, isActive: true } }),
    // Farmácia — Contábil + Fiscal
    prisma.companyDemandTypeLink.create({ data: { tenantId: tId, companyId: farmacia.id, demandTypeId: spedFiscal.id, subtasksEnabled: true, isActive: true } }),
    prisma.companyDemandTypeLink.create({ data: { tenantId: tId, companyId: farmacia.id, demandTypeId: balanco.id, subtasksEnabled: true, isActive: true } }),
    // Distribuidora — DP
    prisma.companyDemandTypeLink.create({ data: { tenantId: tId, companyId: distribuidora.id, demandTypeId: folhaPgto.id, subtasksEnabled: true, isActive: true } }),
    prisma.companyDemandTypeLink.create({ data: { tenantId: tId, companyId: distribuidora.id, demandTypeId: esocial.id, subtasksEnabled: false, isActive: true } }),
  ]);

  console.log(`  ✓ Vínculos: ${links.length} criados`);

  // ── Demandas — Maio 2026 (competência atual) ──────────────────────────────────
  const MAY = 5;
  const YEAR = 2026;
  const dueDate = new Date('2026-05-31T23:59:59Z');

  // Buscar templates de subtarefas para cada tipo
  const spedTemplates = await prisma.subtaskTemplate.findMany({ where: { demandTypeId: spedFiscal.id }, orderBy: { orderIndex: 'asc' } });
  const icmsTemplates = await prisma.subtaskTemplate.findMany({ where: { demandTypeId: icms.id }, orderBy: { orderIndex: 'asc' } });
  const folhaTemplates = await prisma.subtaskTemplate.findMany({ where: { demandTypeId: folhaPgto.id }, orderBy: { orderIndex: 'asc' } });
  const balancoTemplates = await prisma.subtaskTemplate.findMany({ where: { demandTypeId: balanco.id }, orderBy: { orderIndex: 'asc' } });

  async function createDemand(
    companyId: string,
    demandTypeId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'overdue',
    templates: { name: string; isRequired: boolean; orderIndex: number }[],
    completedSubtasks = 0,
    month = MAY,
    year = YEAR,
  ) {
    const completedAt = status === 'completed' ? new Date('2026-05-20T10:00:00Z') : null;
    const demand = await prisma.demand.create({
      data: {
        tenantId: tId,
        companyId,
        demandTypeId,
        competenceMonth: month,
        competenceYear: year,
        status,
        dueDate,
        completedAt,
      },
    });

    if (templates.length > 0) {
      await prisma.subtask.createMany({
        data: templates.map((t, i) => ({
          tenantId: tId,
          demandId: demand.id,
          name: t.name,
          isRequired: t.isRequired,
          orderIndex: t.orderIndex,
          completedAt: i < completedSubtasks ? new Date('2026-05-15T09:00:00Z') : null,
        })),
      });
    }

    return demand;
  }

  // Comercial Souza: SPED (in_progress, 2/4 subtasks), DCTF (pending)
  await createDemand(comercialSouza.id, spedFiscal.id, 'in_progress', spedTemplates, 2);
  await createDemand(comercialSouza.id, dctf.id, 'pending', []);

  // Indústria Norte: SPED (completed, 4/4), ICMS (in_progress, 1/3), DCTF (completed)
  await createDemand(industriaNorte.id, spedFiscal.id, 'completed', spedTemplates, 4);
  await createDemand(industriaNorte.id, icms.id, 'in_progress', icmsTemplates, 1);
  await createDemand(industriaNorte.id, dctf.id, 'completed', []);

  // Tech Solutions: Balanço (in_progress, 1/4), Conciliação (pending)
  await createDemand(techSolutions.id, balanco.id, 'in_progress', balancoTemplates, 1);
  await createDemand(techSolutions.id, conciliacao.id, 'pending', []);

  // Restaurante: Folha (completed, 5/5), eSocial (completed)
  await createDemand(restaurante.id, folhaPgto.id, 'completed', folhaTemplates, 5);
  await createDemand(restaurante.id, esocial.id, 'completed', []);

  // Construtora: DCTF (pending), Folha (in_progress, 3/5), ICMS (pending)
  await createDemand(construtora.id, dctf.id, 'pending', []);
  await createDemand(construtora.id, folhaPgto.id, 'in_progress', folhaTemplates, 3);
  await createDemand(construtora.id, icms.id, 'pending', icmsTemplates, 0);

  // Farmácia: SPED (pending), Balanço (in_progress, 2/4)
  await createDemand(farmacia.id, spedFiscal.id, 'pending', spedTemplates, 0);
  await createDemand(farmacia.id, balanco.id, 'in_progress', balancoTemplates, 2);

  // Distribuidora: Folha (pending), eSocial (pending)
  await createDemand(distribuidora.id, folhaPgto.id, 'pending', folhaTemplates, 0);
  await createDemand(distribuidora.id, esocial.id, 'pending', []);

  console.log(`  ✓ Demandas maio/2026: criadas com subtarefas`);

  // ── Demandas — Abril 2026 (competência anterior com overdue) ─────────────────
  await createDemand(comercialSouza.id, spedFiscal.id, 'overdue', spedTemplates, 1, 4, 2026);
  await createDemand(comercialSouza.id, dctf.id, 'completed', [], 0, 4, 2026);
  await createDemand(industriaNorte.id, spedFiscal.id, 'completed', spedTemplates, 4, 4, 2026);
  await createDemand(industriaNorte.id, dctf.id, 'completed', [], 0, 4, 2026);
  await createDemand(techSolutions.id, balanco.id, 'overdue', balancoTemplates, 2, 4, 2026);
  await createDemand(restaurante.id, folhaPgto.id, 'completed', folhaTemplates, 5, 4, 2026);
  await createDemand(construtora.id, folhaPgto.id, 'completed', folhaTemplates, 5, 4, 2026);

  console.log(`  ✓ Demandas abril/2026: algumas overdue para contexto histórico`);

  // ── Audit Logs ────────────────────────────────────────────────────────────────
  const now = new Date();
  await prisma.auditLog.createMany({
    data: [
      { tenantId: tId, userId: admin.id, action: 'competence.opened', entity: 'demand', entityId: '2026-05', metadata: { created: 16, skipped: 0 }, createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000) },
      { tenantId: tId, userId: anaFiscal.id, action: 'demand.status_changed', entity: 'demand', entityId: 'sped-comercial-souza', metadata: { from: 'pending', to: 'in_progress' }, createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
      { tenantId: tId, userId: anaFiscal.id, action: 'subtask.completed', entity: 'subtask', entityId: 'sped-subtask-1', metadata: { demandId: 'sped-comercial-souza' }, createdAt: new Date(now.getTime() - 90 * 60 * 1000) },
      { tenantId: tId, userId: pedroDP.id, action: 'demand.status_changed', entity: 'demand', entityId: 'folha-restaurante', metadata: { from: 'in_progress', to: 'completed' }, createdAt: new Date(now.getTime() - 60 * 60 * 1000) },
      { tenantId: tId, userId: admin.id, action: 'company_demand_type_link.created', entity: 'company_demand_type_link', entityId: 'link-farmacia-balanco', metadata: { companyId: farmacia.id, demandTypeId: balanco.id }, createdAt: new Date(now.getTime() - 30 * 60 * 1000) },
    ],
  });

  console.log(`  ✓ Logs de auditoria criados`);

  // ── Resumo ────────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed concluído!\n');
  console.log('📋 Credenciais de acesso:');
  console.log('  Admin    → victorveras766@gmail.com  / Admin@2026');
  console.log('  Fiscal   → ana.silva@alpha.com.br    / Collab@2026');
  console.log('  DP       → pedro.santos@alpha.com.br / Collab@2026');
  console.log('  Contábil → maria.oliveira@alpha.com.br / Collab@2026\n');
  console.log(`  tenantId: ${tId}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
