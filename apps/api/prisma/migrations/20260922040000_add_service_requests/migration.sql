-- CreateEnum
CREATE TYPE "service_type_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "service_request_status" AS ENUM ('RECEIVED', 'UNDER_ANALYSIS', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED', 'WAITING_DOCUMENT');

-- CreateEnum
CREATE TYPE "service_request_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "service_types" (
    "id" UUID NOT NULL,
    "municipality_id" UUID NOT NULL,
    "department_id" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "service_type_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_sequences" (
    "municipality_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "protocol_sequences_pkey" PRIMARY KEY ("municipality_id","year")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" UUID NOT NULL,
    "municipality_id" UUID NOT NULL,
    "protocol" TEXT NOT NULL,
    "producer_id" UUID NOT NULL,
    "property_id" UUID,
    "department_id" UUID NOT NULL,
    "service_type_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "service_request_priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "service_request_status" NOT NULL DEFAULT 'RECEIVED',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analyzed_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "scheduled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "assigned_user_id" UUID,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "estimated_cost" DECIMAL(12,2),
    "actual_cost" DECIMAL(12,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_request_history" (
    "id" UUID NOT NULL,
    "service_request_id" UUID NOT NULL,
    "user_id" UUID,
    "previous_status" "service_request_status",
    "new_status" "service_request_status" NOT NULL,
    "comment" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_request_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "service_types_municipality_id_idx" ON "service_types"("municipality_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_types_municipality_id_name_key" ON "service_types"("municipality_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "service_requests_protocol_key" ON "service_requests"("protocol");

-- CreateIndex
CREATE INDEX "service_requests_municipality_id_idx" ON "service_requests"("municipality_id");

-- CreateIndex
CREATE INDEX "service_requests_producer_id_idx" ON "service_requests"("producer_id");

-- CreateIndex
CREATE INDEX "service_requests_status_idx" ON "service_requests"("status");

-- CreateIndex
CREATE INDEX "service_request_history_service_request_id_idx" ON "service_request_history"("service_request_id");

-- AddForeignKey
ALTER TABLE "service_types" ADD CONSTRAINT "service_types_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_types" ADD CONSTRAINT "service_types_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_sequences" ADD CONSTRAINT "protocol_sequences_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "producers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "rural_properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_assigned_user_id_fkey" FOREIGN KEY ("assigned_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_history" ADD CONSTRAINT "service_request_history_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_history" ADD CONSTRAINT "service_request_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
