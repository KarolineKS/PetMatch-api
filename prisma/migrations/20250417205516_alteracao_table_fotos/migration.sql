/*
  Warnings:

  - A unique constraint covering the columns `[fotoCapaId]` on the table `pets` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "fotos" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "fotoCapaId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "pets_fotoCapaId_key" ON "pets"("fotoCapaId");

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_fotoCapaId_fkey" FOREIGN KEY ("fotoCapaId") REFERENCES "fotos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
