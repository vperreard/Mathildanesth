/*
  Warnings:

  - The values [CP,RTT,CSS,MAL,MAT,FORM,RECUP] on the enum `LeaveType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LeaveType_new" AS ENUM ('ANNUAL', 'RECOVERY', 'TRAINING', 'SICK', 'MATERNITY', 'SPECIAL', 'UNPAID', 'OTHER');
ALTER TABLE "leaves" ALTER COLUMN "type" TYPE "LeaveType_new" USING ("type"::text::"LeaveType_new");
ALTER TYPE "LeaveType" RENAME TO "LeaveType_old";
ALTER TYPE "LeaveType_new" RENAME TO "LeaveType";
DROP TYPE "LeaveType_old";
COMMIT;
