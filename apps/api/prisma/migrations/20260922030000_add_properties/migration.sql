-- CreateEnum
CREATE TYPE "property_ownership_type" AS ENUM ('OWNED', 'LEASED', 'LOAN', 'PARTNERSHIP', 'POSSESSION', 'OTHER');

-- CreateEnum
CREATE TYPE "property_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "property_area_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "rural_properties" (
    "id" UUID NOT NULL,
    "municipality_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "registration_number" TEXT,
    "rural_address" TEXT,
    "locality" TEXT,
    "total_area" DECIMAL(12,4) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "car_number" TEXT,
    "state_registration" TEXT,
    "property_type" TEXT,
    "ownership_type" "property_ownership_type" NOT NULL,
    "status" "property_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "rural_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producer_properties" (
    "id" UUID NOT NULL,
    "producer_id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "relationship_type" TEXT,
    "percentage" DOUBLE PRECISION,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producer_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_areas" (
    "id" UUID NOT NULL,
    "property_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "area_hectares" DECIMAL(12,4) NOT NULL,
    "activity" TEXT,
    "crop" TEXT,
    "soil_type" TEXT,
    "irrigation" BOOLEAN NOT NULL DEFAULT false,
    "status" "property_area_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "property_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rural_properties_municipality_id_idx" ON "rural_properties"("municipality_id");

-- CreateIndex
CREATE INDEX "producer_properties_producer_id_idx" ON "producer_properties"("producer_id");

-- CreateIndex
CREATE INDEX "producer_properties_property_id_idx" ON "producer_properties"("property_id");

-- CreateIndex
CREATE INDEX "property_areas_property_id_idx" ON "property_areas"("property_id");

-- AddForeignKey
ALTER TABLE "rural_properties" ADD CONSTRAINT "rural_properties_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producer_properties" ADD CONSTRAINT "producer_properties_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "producers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producer_properties" ADD CONSTRAINT "producer_properties_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "rural_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_areas" ADD CONSTRAINT "property_areas_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "rural_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
