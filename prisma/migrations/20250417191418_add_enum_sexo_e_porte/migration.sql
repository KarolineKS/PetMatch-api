/*
  Warnings:

  - Changed the type of `porte` on the `pets` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `sexo` on the `pets` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Porte" AS ENUM ('PEQUENO', 'MEDIO', 'GRANDE');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MACHO', 'FEMEA');

-- AlterTable
ALTER TABLE "pets" DROP COLUMN "porte",
ADD COLUMN     "porte" "Porte" NOT NULL,
DROP COLUMN "sexo",
ADD COLUMN     "sexo" "Sexo" NOT NULL;
