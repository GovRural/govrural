-- CreateEnum
CREATE TYPE "machine_status" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "machine_service_status" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "machines" (
    "id" UUID NOT NULL,
    "municipality_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "plate" TEXT,
    "serial_number" TEXT,
    "hourly_cost" DECIMAL(12,2) NOT NULL,
    "fuel_type" TEXT,
    "status" "machine_status" NOT NULL DEFAULT 'ACTIVE',
    "current_hour_meter" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machine_services" (
    "id" UUID NOT NULL,
    "municipality_id" UUID NOT NULL,
    "machine_id" UUID NOT NULL,
    "operator_id" UUID,
    "producer_id" UUID NOT NULL,
    "property_id" UUID,
    "service_request_id" UUID,
    "service_type" TEXT NOT NULL,
    "status" "machine_service_status" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_date" TIMESTAMP(3),
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "initial_hour_meter" DECIMAL(12,2),
    "final_hour_meter" DECIMAL(12,2),
    "total_hours" DECIMAL(12,2),
    "fuel_consumption" DECIMAL(12,2),
    "estimated_cost" DECIMAL(12,2),
    "actual_cost" DECIMAL(12,2),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machine_services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "machines_municipality_id_idx" ON "machines"("municipality_id");

-- CreateIndex
CREATE INDEX "machine_services_municipality_id_idx" ON "machine_services"("municipality_id");

-- CreateIndex
CREATE INDEX "machine_services_machine_id_idx" ON "machine_services"("machine_id");

-- CreateIndex
CREATE INDEX "machine_services_status_idx" ON "machine_services"("status");

-- AddForeignKey
ALTER TABLE "machines" ADD CONSTRAINT "machines_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_services" ADD CONSTRAINT "machine_services_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_services" ADD CONSTRAINT "machine_services_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_services" ADD CONSTRAINT "machine_services_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_services" ADD CONSTRAINT "machine_services_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "producers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_services" ADD CONSTRAINT "machine_services_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "rural_properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "machine_services" ADD CONSTRAINT "machine_services_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
