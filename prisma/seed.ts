import { PrismaClient, Porte, Sexo } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const racaGato = await prisma.raca.create({
    data: {
      nome: "Siamês",
    },
  });

  const racaCachorro = await prisma.raca.create({
    data: {
      nome: "Vira-lata",
    },
  });


  const ong = await prisma.ong.create({
    data: {
      nome: "Amigos dos Pets",
      cnpj: "12345678901234",
      telefone: "48999999999",
      email: "amigos@pets.com",
      cidade: "Florianópolis",
      estado: "SC",
    },
  });


  const pets = await Promise.all([
    prisma.pet.create({
      data: {
        nome: "Luna",
        especie: "Gato",
        idade: "2 anos",
        descricao: "Gatinha dócil e brincalhona",
        cor: "Branco e Preto",
        porte: Porte.PEQUENO,
        sexo: Sexo.FEMEA,
        castrado: true,
        vacinado: true,
        vermifugado: true,
        racaId: racaGato.id,
        ongId: ong.id,
      },
    }),
    prisma.pet.create({
      data: {
        nome: "Thor",
        especie: "Cachorro",
        idade: "1 ano",
        descricao: "Cachorro muito energético e carinhoso",
        cor: "Caramelo",
        porte: Porte.MEDIO,
        sexo: Sexo.MACHO,
        castrado: true,
        vacinado: true,
        vermifugado: true,
        racaId: racaCachorro.id,
        ongId: ong.id,
      },
    }),
    prisma.pet.create({
      data: {
        nome: "Nina",
        especie: "Gato",
        idade: "6 meses",
        descricao: "Gatinha muito meiga e sociável",
        cor: "Cinza",
        porte: Porte.PEQUENO,
        sexo: Sexo.FEMEA,
        castrado: false,
        vacinado: true,
        vermifugado: true,
        racaId: racaGato.id,
        ongId: ong.id,
      },
    }),
  ]);

  console.log("Dados inseridos com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
