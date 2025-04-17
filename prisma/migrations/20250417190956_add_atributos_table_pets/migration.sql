/*
  Warnings:

  - You are about to drop the column `caracteristicas` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `observacoes` on the `pets` table. All the data in the column will be lost.
  - You are about to drop the column `temperamento` on the `pets` table. All the data in the column will be lost.
  - Added the required column `especie` to the `pets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `porte` to the `pets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sexo` to the `pets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "pets" DROP COLUMN "caracteristicas",
DROP COLUMN "observacoes",
DROP COLUMN "temperamento",
ADD COLUMN     "castrado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "especie" VARCHAR(20) NOT NULL,
ADD COLUMN     "porte" VARCHAR(20) NOT NULL,
ADD COLUMN     "sexo" VARCHAR(10) NOT NULL,
ADD COLUMN     "vacinado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vermifugado" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "nome" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "idade" SET DATA TYPE VARCHAR(20);
