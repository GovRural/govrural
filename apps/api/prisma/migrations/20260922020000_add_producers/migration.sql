-- CreateEnum
CREATE TYPE "producer_type" AS ENUM ('INDIVIDUAL', 'COMPANY', 'ASSOCIATION', 'COOPERATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "producer_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "producers" (
    "id" UUID NOT NULL,
    "municipality_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "cpf_cnpj" TEXT NOT NULL,
    "producer_type" "producer_type" NOT NULL,
    "birth_date" TIMESTAMP(3),
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "rural_registration" TEXT,
    "state_registration" TEXT,
    "car_number" TEXT,
    "caf_number" TEXT,
    "association" TEXT,
    "cooperative" TEXT,
    "status" "producer_status" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "producers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "producers_municipality_id_idx" ON "producers"("municipality_id");

-- CreateIndex
CREATE UNIQUE INDEX "producers_municipality_id_cpf_cnpj_key" ON "producers"("municipality_id", "cpf_cnpj");

-- AddForeignKey
ALTER TABLE "producers" ADD CONSTRAINT "producers_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
