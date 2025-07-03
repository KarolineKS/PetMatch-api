/*
  Warnings:

  - You are about to drop the column `local` on the `visitas` table. All the data in the column will be lost.
  - Added the required column `horario` to the `visitas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ongs" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "adminId" TEXT;

-- AlterTable
ALTER TABLE "visitas" DROP COLUMN "local",
ADD COLUMN     "adminId" TEXT,
ADD COLUMN     "horario" VARCHAR(20) NOT NULL;

-- CreateTable
CREATE TABLE "admins" (
    "id" VARCHAR(36) NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "email" VARCHAR(40) NOT NULL,
    "senha" VARCHAR(60) NOT NULL,
    "nivel" SMALLINT NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ongs" ADD CONSTRAINT "ongs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
