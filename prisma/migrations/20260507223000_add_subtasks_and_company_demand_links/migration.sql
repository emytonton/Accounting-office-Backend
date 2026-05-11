-- AlterTable
ALTER TABLE "demands" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "demands" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex (unique constraint to guarantee idempotency in US-D01)
CREATE UNIQUE INDEX "demands_tenantId_companyId_demandTypeId_competenceMonth_co_key"
  ON "demands"("tenantId", "companyId", "demandTypeId", "competenceMonth", "competenceYear");

-- CreateTable
CREATE TABLE "subtask_templates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "demandTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "subtask_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_demand_type_links" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "demandTypeId" TEXT NOT NULL,
    "subtasksEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_demand_type_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_demand_type_links_tenantId_companyId_demandTypeId_key"
  ON "company_demand_type_links"("tenantId", "companyId", "demandTypeId");

-- CreateTable
CREATE TABLE "subtasks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "demandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "subtasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "subtask_templates" ADD CONSTRAINT "subtask_templates_demandTypeId_fkey"
  FOREIGN KEY ("demandTypeId") REFERENCES "demand_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subtasks" ADD CONSTRAINT "subtasks_demandId_fkey"
  FOREIGN KEY ("demandId") REFERENCES "demands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
