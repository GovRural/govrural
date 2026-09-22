-- CreateEnum
CREATE TYPE "occurrence_type" AS ENUM ('ROAD', 'BRIDGE', 'FIRE', 'WATER', 'ENERGY', 'ILLEGAL_DUMPING', 'ANIMALS', 'MACHINERY', 'AGRICULTURE', 'HEALTH', 'SECURITY', 'ENVIRONMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "occurrence_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "occurrence_status" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "rural_occurrences" (
    "id" UUID NOT NULL,
    "municipality_id" UUID NOT NULL,
    "reporter_user_id" UUID,
    "department_id" UUID,
    "type" "occurrence_type" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "occurrence_priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "occurrence_status" NOT NULL DEFAULT 'OPEN',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rural_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rural_occurrences_municipality_id_idx" ON "rural_occurrences"("municipality_id");

-- CreateIndex
CREATE INDEX "rural_occurrences_status_idx" ON "rural_occurrences"("status");

-- AddForeignKey
ALTER TABLE "rural_occurrences" ADD CONSTRAINT "rural_occurrences_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rural_occurrences" ADD CONSTRAINT "rural_occurrences_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rural_occurrences" ADD CONSTRAINT "rural_occurrences_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
