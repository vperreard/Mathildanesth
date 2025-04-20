/*
  Warnings:

  - Changed the type of `status` on the `Surgeon` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Manual edit: Modified ALTER TABLE to use USING clause for type casting instead of DROP/ADD.
  - Manual edit 2: Added step to drop default value before altering type.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIF', 'INACTIF');

-- AlterTable
-- Original generated: ALTER TABLE "Surgeon" DROP COLUMN "status", ADD COLUMN "status" "UserStatus" NOT NULL;
-- Manual edit: Use ALTER COLUMN with USING for type conversion
ALTER TABLE "Surgeon" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Surgeon"
    ALTER COLUMN "status" TYPE "UserStatus"
    USING "status"::text::"UserStatus";
