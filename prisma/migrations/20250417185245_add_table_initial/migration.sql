-- CreateTable
CREATE TABLE "racas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(30) NOT NULL,

    CONSTRAINT "racas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(30) NOT NULL,
    "idade" SMALLINT NOT NULL,
    "ongId" INTEGER NOT NULL,
    "caracteristicas" TEXT,
    "cor" VARCHAR(30) NOT NULL,
    "racaId" INTEGER NOT NULL,
    "temperamento" VARCHAR(30) NOT NULL,
    "observacoes" TEXT,
    "adotado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" SERIAL NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "petId" INTEGER NOT NULL,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ongs" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(30) NOT NULL,
    "cnpj" VARCHAR(14) NOT NULL,
    "telefone" VARCHAR(11),
    "email" VARCHAR(50),
    "site" VARCHAR(50),
    "endereco" VARCHAR(100),
    "cidade" VARCHAR(50),
    "estado" VARCHAR(2),
    "cep" VARCHAR(8),

    CONSTRAINT "ongs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "ongs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_racaId_fkey" FOREIGN KEY ("racaId") REFERENCES "racas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
