-- CreateIndex
CREATE UNIQUE INDEX "receipts_tenantId_year_number_key"
  ON "receipts"("tenantId", "year", "number");
