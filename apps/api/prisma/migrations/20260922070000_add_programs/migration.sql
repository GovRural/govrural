-- CreateEnum
CREATE TYPE "program_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "program_beneficiary_status" AS ENUM ('PENDING', 'APPROVED', 'DELIVERED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "programs" (
    "id" UUID NOT NULL,
    "municipality_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "budget" DECIMAL(14,2),
    "eligibility_rules" TEXT,
    "status" "program_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_beneficiaries" (
    "id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "producer_id" UUID NOT NULL,
    "property_id" UUID,
    "benefit_type" TEXT NOT NULL,
    "quantity" DECIMAL(12,4),
    "unit" TEXT,
    "value" DECIMAL(12,2),
    "status" "program_beneficiary_status" NOT NULL DEFAULT 'PENDING',
    "approval_date" TIMESTAMP(3),
    "delivery_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "programs_municipality_id_idx" ON "programs"("municipality_id");

-- CreateIndex
CREATE UNIQUE INDEX "programs_municipality_id_name_key" ON "programs"("municipality_id", "name");

-- CreateIndex
CREATE INDEX "program_beneficiaries_program_id_idx" ON "program_beneficiaries"("program_id");

-- CreateIndex
CREATE INDEX "program_beneficiaries_producer_id_idx" ON "program_beneficiaries"("producer_id");

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_beneficiaries" ADD CONSTRAINT "program_beneficiaries_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_beneficiaries" ADD CONSTRAINT "program_beneficiaries_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "producers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_beneficiaries" ADD CONSTRAINT "program_beneficiaries_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "rural_properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;
