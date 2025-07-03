import {
  PrismaClient,
  Porte,
  Sexo,
  StatusVisita,
  TipoCurtida,
  StatusMatch,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Criar raças
  console.log("📊 Criando raças...");
  const racas = await Promise.all([
    prisma.raca.create({ data: { nome: "Labrador" } }),
    prisma.raca.create({ data: { nome: "Golden Retriever" } }),
    prisma.raca.create({ data: { nome: "Vira-lata" } }),
    prisma.raca.create({ data: { nome: "Bulldog" } }),
    prisma.raca.create({ data: { nome: "Beagle" } }),
    prisma.raca.create({ data: { nome: "Pastor Alemão" } }),
    prisma.raca.create({ data: { nome: "Poodle" } }),
    prisma.raca.create({ data: { nome: "Chihuahua" } }),
    prisma.raca.create({ data: { nome: "Shih Tzu" } }),
    prisma.raca.create({ data: { nome: "Husky Siberiano" } }),
  ]);

  // Criar ONGs
  console.log("🏢 Criando ONGs...");
  const ongs = await Promise.all([
    prisma.ong.create({
      data: {
        nome: "Amor Animal SP",
        cnpj: "12345678000123",
        telefone: "11987654321",
        email: "contato@amoranimalsp.org",
        site: "www.amoranimalsp.org",
        endereco: "Rua das Flores, 123",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01234567",
      },
    }),
    prisma.ong.create({
      data: {
        nome: "Resgate Feliz RJ",
        cnpj: "98765432000187",
        telefone: "21976543210",
        email: "resgate@felizrj.org",
        site: "www.resgatefelizrj.org",
        endereco: "Avenida Central, 456",
        cidade: "Rio de Janeiro",
        estado: "RJ",
        cep: "20123456",
      },
    }),
    prisma.ong.create({
      data: {
        nome: "Patinhas do Bem MG",
        cnpj: "11223344000155",
        telefone: "31965432109",
        email: "contato@patinhasdobemmg.org",
        endereco: "Rua da Esperança, 789",
        cidade: "Belo Horizonte",
        estado: "MG",
        cep: "30123789",
      },
    }),
  ]);

  // Criar pets com fotos
  console.log("🐕 Criando pets...");
  const pets = [
    {
      nome: "Thor",
      especie: "Cão",
      idade: "2 anos",
      descricao:
        "Thor é um cão muito carinhoso e brincalhão. Adora crianças e outros animais.",
      cor: "Dourado",
      porte: Porte.GRANDE,
      sexo: Sexo.MACHO,
      castrado: true,
      vacinado: true,
      vermifugado: true,
      ongId: ongs[0].id,
      racaId: racas[0].id, // Labrador
      fotos: [
        "https://images.unsplash.com/photo-1552053831-71594a27632d?w=500",
        "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=500",
      ],
    },
    {
      nome: "Luna",
      especie: "Cão",
      idade: "1 ano",
      descricao:
        "Luna é uma cadela doce e inteligente, perfeita para famílias.",
      cor: "Preto e branco",
      porte: Porte.MEDIO,
      sexo: Sexo.FEMEA,
      castrado: true,
      vacinado: true,
      vermifugado: true,
      ongId: ongs[1].id,
      racaId: racas[2].id, // Vira-lata
      fotos: [
        "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=500",
        "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=500",
      ],
    },
    {
      nome: "Max",
      especie: "Cão",
      idade: "3 anos",
      descricao: "Max é energético e leal, ideal para pessoas ativas.",
      cor: "Marrom",
      porte: Porte.GRANDE,
      sexo: Sexo.MACHO,
      castrado: false,
      vacinado: true,
      vermifugado: true,
      ongId: ongs[0].id,
      racaId: racas[1].id, // Golden Retriever
      fotos: [
        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=500",
        "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=500",
      ],
    },
    {
      nome: "Bella",
      especie: "Cão",
      idade: "4 anos",
      descricao: "Bella é calma e carinhosa, adora relaxar no sofá.",
      cor: "Branco",
      porte: Porte.PEQUENO,
      sexo: Sexo.FEMEA,
      castrado: true,
      vacinado: true,
      vermifugado: false,
      ongId: ongs[2].id,
      racaId: racas[6].id, // Poodle
      fotos: [
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=500",
        "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=500",
      ],
    },
    {
      nome: "Rocky",
      especie: "Cão",
      idade: "5 anos",
      descricao: "Rocky é protetor e leal, excelente cão de guarda.",
      cor: "Preto",
      porte: Porte.GRANDE,
      sexo: Sexo.MACHO,
      castrado: true,
      vacinado: true,
      vermifugado: true,
      ongId: ongs[1].id,
      racaId: racas[5].id, // Pastor Alemão
      fotos: [
        "https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=500",
        "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=500",
      ],
    },
    {
      nome: "Mel",
      especie: "Cão",
      idade: "6 meses",
      descricao: "Mel é uma filhote muito brincalhona e curiosa.",
      cor: "Caramelo",
      porte: Porte.PEQUENO,
      sexo: Sexo.FEMEA,
      castrado: false,
      vacinado: true,
      vermifugado: true,
      ongId: ongs[2].id,
      racaId: racas[2].id, // Vira-lata
      fotos: [
        "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=500",
        "https://images.unsplash.com/photo-1559190394-df5a28aab5c5?w=500",
      ],
    },
  ];

  for (const petData of pets) {
    const { fotos: fotosUrls, ...petInfo } = petData;

    const pet = await prisma.pet.create({
      data: petInfo,
    });

    // Criar fotos para o pet
    const fotosCreated = await Promise.all(
      fotosUrls.map((url) =>
        prisma.foto.create({
          data: {
            url,
            petId: pet.id,
          },
        })
      )
    );

    // Definir a primeira foto como capa
    await prisma.pet.update({
      where: { id: pet.id },
      data: { fotoCapaId: fotosCreated[0].id },
    });
  }

  // Criar clientes
  console.log("👥 Criando clientes...");
  const senhaHash = await bcrypt.hash("123456", 12);
  const clientes = await Promise.all([
    prisma.cliente.create({
      data: {
        nome: "João Silva",
        email: "joao@email.com",
        senha: senhaHash,
      },
    }),
    prisma.cliente.create({
      data: {
        nome: "Maria Santos",
        email: "maria@email.com",
        senha: senhaHash,
      },
    }),
    prisma.cliente.create({
      data: {
        nome: "Pedro Oliveira",
        email: "pedro@email.com",
        senha: senhaHash,
      },
    }),
  ]);

  // Criar admins com diferentes níveis
  console.log("👨‍💼 Criando admins...");

  const adminSenhaHash1 = await bcrypt.hash("Admin123@", 12);
  const adminSenhaHash2 = await bcrypt.hash("Ong123@", 12);
  const adminSenhaHash3 = await bcrypt.hash("Usuario123@", 12);

  await Promise.all([
    // Admin máximo (nível 3)
    prisma.admin.create({
      data: {
        nome: "Admin Sistema",
        email: "admin@petmatch.com",
        senha: adminSenhaHash1,
        nivel: 3,
      },
    }),
    // ONG (nível 2)
    prisma.admin.create({
      data: {
        nome: "Admin ONG Amor Animal",
        email: "admin@amoranimal.org",
        senha: adminSenhaHash2,
        nivel: 2,
      },
    }),
    // Usuário (nível 1)
    prisma.admin.create({
      data: {
        nome: "Usuário Sistema",
        email: "usuario@petmatch.com",
        senha: adminSenhaHash3,
        nivel: 1,
      },
    }),
  ]);

  // Criar algumas visitas
  console.log("📅 Criando visitas...");
  const petsCreated = await prisma.pet.findMany();

  await Promise.all([
    prisma.visita.create({
      data: {
        clienteId: clientes[0].id,
        petId: petsCreated[0].id,
        horario: "14:00",
        status: StatusVisita.PENDENTE,
      },
    }),
    prisma.visita.create({
      data: {
        clienteId: clientes[1].id,
        petId: petsCreated[1].id,
        horario: "16:30",
        status: StatusVisita.CONFIRMADA,
      },
    }),
    prisma.visita.create({
      data: {
        clienteId: clientes[2].id,
        petId: petsCreated[2].id,
        horario: "09:00",
        status: StatusVisita.CONCLUIDA,
      },
    }),
  ]);

  // Criar horários de funcionamento das ONGs
  console.log("⏰ Criando horários de funcionamento...");
  await Promise.all([
    // ONG 1 - Amor Animal SP (Segunda a Sábado)
    prisma.horarioFuncionamento.create({
      data: {
        ongId: ongs[0].id,
        diaSemana: 1, // Segunda
        horaInicio: "08:00",
        horaFim: "17:00",
        intervaloMinutos: 30,
        maxVisitasSimultaneas: 3,
      },
    }),
    prisma.horarioFuncionamento.create({
      data: {
        ongId: ongs[0].id,
        diaSemana: 2, // Terça
        horaInicio: "08:00",
        horaFim: "17:00",
        intervaloMinutos: 30,
        maxVisitasSimultaneas: 3,
      },
    }),
    prisma.horarioFuncionamento.create({
      data: {
        ongId: ongs[0].id,
        diaSemana: 6, // Sábado
        horaInicio: "09:00",
        horaFim: "16:00",
        intervaloMinutos: 45,
        maxVisitasSimultaneas: 2,
      },
    }),

    // ONG 2 - Resgate Feliz RJ (Todos os dias)
    prisma.horarioFuncionamento.create({
      data: {
        ongId: ongs[1].id,
        diaSemana: 0, // Domingo
        horaInicio: "10:00",
        horaFim: "15:00",
        intervaloMinutos: 60,
        maxVisitasSimultaneas: 2,
      },
    }),
    prisma.horarioFuncionamento.create({
      data: {
        ongId: ongs[1].id,
        diaSemana: 3, // Quarta
        horaInicio: "09:00",
        horaFim: "18:00",
        intervaloMinutos: 30,
        maxVisitasSimultaneas: 4,
      },
    }),
  ]);

  // Criar algumas curtidas de exemplo
  console.log("❤️ Criando curtidas...");
  await Promise.all([
    prisma.curtida.create({
      data: {
        clienteId: clientes[0].id,
        petId: petsCreated[0].id,
        tipo: TipoCurtida.LIKE,
      },
    }),
    prisma.curtida.create({
      data: {
        clienteId: clientes[0].id,
        petId: petsCreated[1].id,
        tipo: TipoCurtida.LIKE,
      },
    }),
    prisma.curtida.create({
      data: {
        clienteId: clientes[1].id,
        petId: petsCreated[0].id,
        tipo: TipoCurtida.DISLIKE,
      },
    }),
    prisma.curtida.create({
      data: {
        clienteId: clientes[1].id,
        petId: petsCreated[2].id,
        tipo: TipoCurtida.LIKE,
      },
    }),
    prisma.curtida.create({
      data: {
        clienteId: clientes[2].id,
        petId: petsCreated[3].id,
        tipo: TipoCurtida.LIKE,
      },
    }),
  ]);

  // Criar alguns matches de exemplo
  console.log("💝 Criando matches...");
  await Promise.all([
    prisma.match.create({
      data: {
        clienteId: clientes[1].id,
        petId: petsCreated[1].id,
        status: StatusMatch.ATIVO,
      },
    }),
    prisma.match.create({
      data: {
        clienteId: clientes[2].id,
        petId: petsCreated[2].id,
        status: StatusMatch.ADOTADO,
      },
    }),
  ]);

  // Criar exceção de horário (exemplo de feriado)
  console.log("🚫 Criando exceções de horário...");
  const proximoFeriado = new Date();
  proximoFeriado.setDate(proximoFeriado.getDate() + 15); // 15 dias no futuro

  await prisma.excecaoHorario.create({
    data: {
      ongId: ongs[0].id,
      data: proximoFeriado,
      motivo: "Feriado Nacional - Fechado",
    },
  });

  console.log("✅ Seed concluído com sucesso!");
  console.log(
    `📊 Criados: ${racas.length} raças, ${ongs.length} ONGs, ${pets.length} pets, ${clientes.length} clientes`
  );
  console.log("❤️ Sistema de curtidas, matches e horários configurado!");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
