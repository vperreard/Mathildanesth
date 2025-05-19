-- CreateEnum
CREATE TYPE "TrameRoleType" AS ENUM ('MAR', 'IADE', 'CHIRURGIEN', 'TOUS');

-- AlterTable
ALTER TABLE "trame_modeles" ADD COLUMN     "roles" "TrameRoleType"[] DEFAULT ARRAY['TOUS']::"TrameRoleType"[];
