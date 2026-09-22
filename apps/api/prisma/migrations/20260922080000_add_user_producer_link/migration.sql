-- AlterTable
ALTER TABLE "users" ADD COLUMN "producer_id" UUID;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "producers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
