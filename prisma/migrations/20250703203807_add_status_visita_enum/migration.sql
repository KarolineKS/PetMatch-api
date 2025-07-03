/*
  Warnings:

  - The `status` column on the `visitas` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "StatusVisita" AS ENUM ('PENDENTE', 'CONFIRMADA', 'CANCELADA', 'CONCLUIDA');

-- AlterTable
ALTER TABLE "visitas" DROP COLUMN "status",
ADD COLUMN     "status" "StatusVisita" NOT NULL DEFAULT 'PENDENTE';
