import { IDemandsRepository } from './demands.repository';
import { ICompaniesRepository } from '../companies/companies.repository';
import { IDemandTypesRepository } from '../demand-types/demand-types.repository';
import { ILinksRepository } from '../company-demand-type-links/links.repository';
import {
  DashboardBreakdown,
  DashboardCount,
  DashboardFilters,
  DashboardResult,
  Demand,
  DemandStatus,
  ListDemandsFilters,
  OpenCompetenceDto,
  OpenCompetenceResult,
  Subtask,
} from './demands.types';
import { AppError } from '../../shared/errors/AppError';
import { AuthenticatedUser } from '../../shared/types';

const VALID_STATUSES: DemandStatus[] = ['pending', 'in_progress', 'completed', 'overdue'];

/// Calcula on-the-fly se a demanda esta atrasada (US-D03 / RN-009).
/// Nao altera o status persistido; apenas devolve uma flag para a UI/agregados.
function computeOverdue(demand: Demand, now: Date = new Date()): boolean {
  if (!demand.dueDate) return false;
  if (demand.status === 'completed') return false;
  return new Date(demand.dueDate).getTime() < now.getTime();
}

function withOverdueFlag(demand: Demand, now: Date = new Date()): Demand {
  return { ...demand, isOverdue: computeOverdue(demand, now) };
}

function withOverdueFlags(demands: Demand[], now: Date = new Date()): Demand[] {
  return demands.map((d) => withOverdueFlag(d, now));
}

function emptyCount(): DashboardCount {
  return {
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    overdue: 0,
    completionRate: 0,
  };
}

function accumulate(target: DashboardCount, demand: Demand): void {
  target.total += 1;
  if (demand.status === 'completed') target.completed += 1;
  else if (demand.status === 'in_progress') target.inProgress += 1;
  else target.pending += 1;
  if (computeOverdue(demand)) target.overdue += 1;
}

function finalizeRate(c: DashboardCount): void {
  c.completionRate = c.total === 0 ? 0 : Math.round((c.completed / c.total) * 10000) / 100;
}

export class DemandsService {
  constructor(
    private readonly repository: IDemandsRepository,
    private readonly companiesRepository: ICompaniesRepository,
    private readonly demandTypesRepository: IDemandTypesRepository,
    private readonly linksRepository: ILinksRepository,
  ) {}

  async findAll(filters: ListDemandsFilters, user?: AuthenticatedUser): Promise<Demand[]> {
    // RF-005: colaborador só enxerga demandas do seu setor.
    if (user && user.role === 'collaborator' && user.sector) {
      filters.sector = user.sector;
    }

    // Quando há filtro por setor, precisamos cruzar com demand_types do setor.
    if (filters.sector) {
      const types = await this.demandTypesRepository.findAll({
        tenantId: filters.tenantId,
        sector: filters.sector,
      });
      const typeIds = new Set(types.map((t) => t.id));
      const all = await this.repository.findAll(filters);
      return withOverdueFlags(all.filter((d) => typeIds.has(d.demandTypeId)));
    }

    const all = await this.repository.findAll(filters);
    return withOverdueFlags(all);
  }

  async findById(tenantId: string, id: string): Promise<Demand> {
    const d = await this.repository.findById(tenantId, id);
    if (!d) throw new AppError('Demand not found', 404, 'NOT_FOUND');
    return withOverdueFlag(d);
  }

  /// US-D01: gera demandas para a competência (mês/ano).
  ///   - Para cada empresa ATIVA do tenant (RN-003), para cada vínculo ATIVO
  ///     empresa↔tipo de demanda, cria uma instância de demanda se ainda não
  ///     existir naquele competência (idempotência, RN-009).
  ///   - Se o vínculo tem subtasksEnabled=true e o tipo tem hasSubtasks=true,
  ///     copia os templates de subtarefas para a demanda criada.
  async openCompetence(dto: OpenCompetenceDto): Promise<OpenCompetenceResult> {
    if (dto.competenceMonth < 1 || dto.competenceMonth > 12) {
      throw new AppError('competenceMonth must be between 1 and 12', 400, 'INVALID_INPUT');
    }
    if (dto.competenceYear < 2000 || dto.competenceYear > 9999) {
      throw new AppError('competenceYear must be a valid year', 400, 'INVALID_INPUT');
    }

    // 1) Empresas ativas (filtro opcional por companyIds)
    const companiesResult = await this.companiesRepository.findAll({
      tenantId: dto.tenantId,
      isActive: true,
      limit: 1000,
    });
    let companies = companiesResult.items;
    if (dto.companyIds && dto.companyIds.length > 0) {
      const wanted = new Set(dto.companyIds);
      companies = companies.filter((c) => wanted.has(c.id));
    }
    if (companies.length === 0) {
      return { created: 0, skipped: 0, details: [] };
    }

    // 2) Vínculos ativos de todas as empresas alvo
    const links = await this.linksRepository.findActiveLinksForGeneration(
      dto.tenantId,
      companies.map((c) => c.id),
    );
    if (links.length === 0) {
      return { created: 0, skipped: 0, details: [] };
    }

    // 3) Tipos de demanda do tenant (precisamos do hasSubtasks + templates)
    const demandTypes = await this.demandTypesRepository.findAll({
      tenantId: dto.tenantId,
      isActive: true,
    });
    const typeById = new Map(demandTypes.map((t) => [t.id, t]));

    const result: OpenCompetenceResult = { created: 0, skipped: 0, details: [] };

    // 4) Itera cada vínculo e cria/pula demanda
    for (const link of links) {
      const dt = typeById.get(link.demandTypeId);
      if (!dt) {
        // tipo foi removido/inativado depois do vínculo — ignora.
        continue;
      }

      // Idempotência: já existe?
      const existing = await this.repository.findByCompetence(
        dto.tenantId,
        link.companyId,
        link.demandTypeId,
        dto.competenceMonth,
        dto.competenceYear,
      );
      if (existing) {
        result.skipped += 1;
        result.details.push({
          companyId: link.companyId,
          demandTypeId: link.demandTypeId,
          status: 'skipped_existing',
          demandId: existing.id,
        });
        continue;
      }

      // Subtasks: só se o vínculo permite E o tipo tem subtasks definidas.
      const useSubtasks = link.subtasksEnabled && dt.hasSubtasks;
      const subtaskTemplates = useSubtasks
        ? await this.demandTypesRepository.listSubtaskTemplates(dto.tenantId, dt.id)
        : [];

      const demand = await this.repository.createWithSubtasks(
        {
          tenantId: dto.tenantId,
          companyId: link.companyId,
          demandTypeId: link.demandTypeId,
          competenceMonth: dto.competenceMonth,
          competenceYear: dto.competenceYear,
          status: 'pending',
          dueDate: dto.dueDate,
        },
        subtaskTemplates.map((t) => ({
          name: t.name,
          isRequired: t.isRequired,
          orderIndex: t.orderIndex,
        })),
      );

      result.created += 1;
      result.details.push({
        companyId: link.companyId,
        demandTypeId: link.demandTypeId,
        status: 'created',
        demandId: demand.id,
      });
    }

    return result;
  }

  /// US-D02: atualiza status com validações de RN-004 e RF-005.
  async updateStatus(
    tenantId: string,
    id: string,
    newStatus: DemandStatus,
    actor: AuthenticatedUser,
  ): Promise<Demand> {
    if (!VALID_STATUSES.includes(newStatus)) {
      throw new AppError(`Invalid status '${newStatus}'`, 400, 'INVALID_STATUS');
    }

    const demand = await this.repository.findById(tenantId, id);
    if (!demand) throw new AppError('Demand not found', 404, 'NOT_FOUND');

    // RF-005: colaborador só atualiza demandas do próprio setor.
    if (actor.role === 'collaborator') {
      const dt = await this.demandTypesRepository.findById(tenantId, demand.demandTypeId);
      if (!dt || dt.sector !== actor.sector) {
        throw new AppError(
          'You can only update demands of your own sector',
          403,
          'FORBIDDEN_SECTOR',
        );
      }
    }

    // RN-004: para concluir, todas as subtasks OBRIGATÓRIAS devem estar concluídas.
    if (newStatus === 'completed') {
      const pendingRequired = (demand.subtasks ?? []).filter(
        (s) => s.isRequired && !s.completedAt,
      );
      if (pendingRequired.length > 0) {
        throw new AppError(
          `Cannot complete demand: ${pendingRequired.length} required subtask(s) still pending`,
          409,
          'REQUIRED_SUBTASKS_PENDING',
        );
      }
    }

    const completedAt = newStatus === 'completed' ? new Date() : null;
    const updated = await this.repository.updateStatus(tenantId, id, newStatus, completedAt);
    return updated as Demand;
  }

  /// US-D02: marca/desmarca conclusão de subtarefa.
  async setSubtaskCompletion(
    tenantId: string,
    subtaskId: string,
    completed: boolean,
    actor: AuthenticatedUser,
  ): Promise<Subtask> {
    const subtask = await this.repository.findSubtaskById(tenantId, subtaskId);
    if (!subtask) throw new AppError('Subtask not found', 404, 'NOT_FOUND');

    if (actor.role === 'collaborator') {
      const demand = await this.repository.findById(tenantId, subtask.demandId);
      if (!demand) throw new AppError('Demand not found', 404, 'NOT_FOUND');
      const dt = await this.demandTypesRepository.findById(tenantId, demand.demandTypeId);
      if (!dt || dt.sector !== actor.sector) {
        throw new AppError(
          'You can only update subtasks of your own sector',
          403,
          'FORBIDDEN_SECTOR',
        );
      }
    }

    const updated = await this.repository.markSubtask(
      tenantId,
      subtaskId,
      completed ? new Date() : null,
    );
    return updated as Subtask;
  }

  /// US-D03: define ou remove o prazo de uma demanda. Respeita escopo de setor (RF-005).
  async updateDueDate(
    tenantId: string,
    id: string,
    dueDate: Date | null,
    actor: AuthenticatedUser,
  ): Promise<Demand> {
    const demand = await this.repository.findById(tenantId, id);
    if (!demand) throw new AppError('Demand not found', 404, 'NOT_FOUND');

    if (actor.role === 'collaborator') {
      const dt = await this.demandTypesRepository.findById(tenantId, demand.demandTypeId);
      if (!dt || dt.sector !== actor.sector) {
        throw new AppError(
          'You can only update demands of your own sector',
          403,
          'FORBIDDEN_SECTOR',
        );
      }
    }

    const updated = await this.repository.updateDueDate(tenantId, id, dueDate);
    return withOverdueFlag(updated as Demand);
  }

  /// US-D04: monta o painel consolidado com totais e percentuais
  /// agrupados por setor e por empresa.
  async getDashboard(filters: DashboardFilters): Promise<DashboardResult> {
    const all = await this.repository.findAll({
      tenantId: filters.tenantId,
      competenceMonth: filters.competenceMonth,
      competenceYear: filters.competenceYear,
      companyId: filters.companyId,
    });

    // Cruza com demand_types para obter o setor (necessario p/ filtro e breakdown).
    const types = await this.demandTypesRepository.findAll({ tenantId: filters.tenantId });
    const typeById = new Map(types.map((t) => [t.id, t]));

    let demands = all;
    if (filters.sector) {
      demands = demands.filter((d) => typeById.get(d.demandTypeId)?.sector === filters.sector);
    }

    if (demands.length === 0) {
      return {
        competence: { month: filters.competenceMonth, year: filters.competenceYear },
        overall: emptyCount(),
        bySector: [],
        byCompany: [],
        isEmpty: true,
        message: 'No data available for the selected competence',
      };
    }

    // Carrega empresas referenciadas para enriquecer labels do breakdown.
    const companyIds = Array.from(new Set(demands.map((d) => d.companyId)));
    const companyLabel = new Map<string, string>();
    for (const cid of companyIds) {
      const c = await this.companiesRepository.findById(filters.tenantId, cid);
      if (c) companyLabel.set(cid, c.name);
    }

    const overall: DashboardCount = emptyCount();
    const sectorMap = new Map<string, DashboardCount>();
    const companyMap = new Map<string, DashboardCount>();

    for (const d of demands) {
      accumulate(overall, d);

      const sector = typeById.get(d.demandTypeId)?.sector ?? 'unknown';
      if (!sectorMap.has(sector)) sectorMap.set(sector, emptyCount());
      accumulate(sectorMap.get(sector)!, d);

      if (!companyMap.has(d.companyId)) companyMap.set(d.companyId, emptyCount());
      accumulate(companyMap.get(d.companyId)!, d);
    }

    finalizeRate(overall);
    const bySector: DashboardBreakdown[] = [];
    for (const [key, counts] of sectorMap.entries()) {
      finalizeRate(counts);
      bySector.push({ key, label: key, counts });
    }
    const byCompany: DashboardBreakdown[] = [];
    for (const [key, counts] of companyMap.entries()) {
      finalizeRate(counts);
      byCompany.push({ key, label: companyLabel.get(key), counts });
    }

    bySector.sort((a, b) => a.key.localeCompare(b.key));
    byCompany.sort((a, b) => (a.label ?? a.key).localeCompare(b.label ?? b.key));

    return {
      competence: { month: filters.competenceMonth, year: filters.competenceYear },
      overall,
      bySector,
      byCompany,
      isEmpty: false,
    };
  }
}
