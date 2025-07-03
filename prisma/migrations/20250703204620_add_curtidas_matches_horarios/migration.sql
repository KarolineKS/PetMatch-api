-- CreateEnum
CREATE TYPE "TipoCurtida" AS ENUM ('LIKE', 'DISLIKE');

-- CreateEnum
CREATE TYPE "StatusMatch" AS ENUM ('ATIVO', 'INATIVO', 'ADOTADO');

-- CreateTable
CREATE TABLE "curtidas" (
    "id" VARCHAR(36) NOT NULL,
    "clienteId" TEXT NOT NULL,
    "petId" INTEGER NOT NULL,
    "tipo" "TipoCurtida" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "curtidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" VARCHAR(36) NOT NULL,
    "clienteId" TEXT NOT NULL,
    "petId" INTEGER NOT NULL,
    "status" "StatusMatch" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios_funcionamento" (
    "id" SERIAL NOT NULL,
    "ongId" INTEGER NOT NULL,
    "diaSemana" SMALLINT NOT NULL,
    "horaInicio" VARCHAR(5) NOT NULL,
    "horaFim" VARCHAR(5) NOT NULL,
    "intervaloMinutos" INTEGER NOT NULL DEFAULT 30,
    "maxVisitasSimultaneas" INTEGER NOT NULL DEFAULT 2,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horarios_funcionamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "excecoes_horario" (
    "id" SERIAL NOT NULL,
    "ongId" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "motivo" VARCHAR(100) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "excecoes_horario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "curtidas_clienteId_petId_key" ON "curtidas"("clienteId", "petId");

-- CreateIndex
CREATE UNIQUE INDEX "matches_clienteId_petId_key" ON "matches"("clienteId", "petId");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_funcionamento_ongId_diaSemana_key" ON "horarios_funcionamento"("ongId", "diaSemana");

-- AddForeignKey
ALTER TABLE "curtidas" ADD CONSTRAINT "curtidas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curtidas" ADD CONSTRAINT "curtidas_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios_funcionamento" ADD CONSTRAINT "horarios_funcionamento_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "ongs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "excecoes_horario" ADD CONSTRAINT "excecoes_horario_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "ongs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
