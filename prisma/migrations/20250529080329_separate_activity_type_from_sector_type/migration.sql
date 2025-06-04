-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "activityTypeId" TEXT,
ALTER COLUMN "type" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_activityTypeId_fkey" FOREIGN KEY ("activityTypeId") REFERENCES "activity_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
