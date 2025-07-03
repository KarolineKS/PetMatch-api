import { PrismaClient } from "@prisma/client";
import { Router, Request, Response } from "express";
import { z } from "zod";
import { verificaTokenENivel } from "../middleware/verificaToken";

const prisma = new PrismaClient();
// const prisma = new PrismaClient({
//   log: [
//     {
//       emit: 'event',
//       level: 'query',
//     },
//     {
//       emit: 'stdout',
//       level: 'error',
//     },
//     {
//       emit: 'stdout',
//       level: 'info',
//     },
//     {
//       emit: 'stdout',
//       level: 'warn',
//     },
//   ],
// })

// prisma.$on('query', (e) => {
//   console.log('Query: ' + e.query)
//   console.log('Params: ' + e.params)
//   console.log('Duration: ' + e.duration + 'ms')
// })

const router = Router();

const petSchema = z.object({
  nome: z.string().min(2).max(50),
  especie: z.string().min(2).max(20),
  idade: z.string().max(20),
  ongId: z.number().int().positive(),
  descricao: z.string().optional(),
  cor: z.string().max(30),
  racaId: z.number().int().positive(),
  porte: z.enum(["PEQUENO", "MEDIO", "GRANDE"]),
  sexo: z.enum(["MACHO", "FEMEA"]),
  castrado: z.boolean(),
  vacinado: z.boolean(),
  vermifugado: z.boolean(),
  adotado: z.boolean().default(false),
});

router.get("/", async (req, res) => {
  try {
    const pets = await prisma.pet.findMany({
      include: {
        ong: true,
        raca: true,
        fotos: true,
        fotoCapa: true,
      },
    });
    res.status(200).json(pets);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

// ONGs e admins podem criar pets
router.post(
  "/",
  verificaTokenENivel(2),
  async (req: Request, res: Response) => {
    const valida = petSchema.safeParse(req.body);

    if (!valida.success) {
      res.status(400).json({ erro: valida.error });
      return;
    }

    const {
      nome,
      especie,
      idade,
      ongId,
      descricao,
      cor,
      racaId,
      porte,
      sexo,
      castrado,
      vacinado,
      vermifugado,
      adotado,
    } = valida.data;

    try {
      const pet = await prisma.pet.create({
        data: {
          nome,
          especie,
          idade,
          ongId,
          descricao,
          cor,
          racaId,
          porte,
          sexo,
          castrado,
          vacinado,
          vermifugado,
          adotado,
        },
        include: {
          ong: true,
          raca: true,
          fotos: true,
        },
      });
      res.status(201).json(pet);
    } catch (error) {
      res.status(400).json({ error });
    }
  }
);

// Apenas admins máximos podem deletar pets
router.delete(
  "/:id",
  verificaTokenENivel(3),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const pet = await prisma.pet.delete({
        where: { id: Number(id) },
      });
      res.status(200).json(pet);
    } catch (error) {
      res.status(400).json({ erro: error });
    }
  }
);

// ONGs e admins podem editar pets
router.put(
  "/:id",
  verificaTokenENivel(2),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const valida = petSchema.safeParse(req.body);
    if (!valida.success) {
      res.status(400).json({ erro: valida.error });
      return;
    }

    const {
      nome,
      especie,
      idade,
      ongId,
      descricao,
      cor,
      racaId,
      porte,
      sexo,
      castrado,
      vacinado,
      vermifugado,
      adotado,
    } = valida.data;

    try {
      const pet = await prisma.pet.update({
        where: { id: Number(id) },
        data: {
          nome,
          especie,
          idade,
          ongId,
          descricao,
          cor,
          racaId,
          porte,
          sexo,
          castrado,
          vacinado,
          vermifugado,
          adotado,
        },
        include: {
          ong: true,
          raca: true,
          fotos: true,
        },
      });
      res.status(200).json(pet);
    } catch (error) {
      res.status(400).json({ error });
    }
  }
);

router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params;

  try {
    const pets = await prisma.pet.findMany({
      include: {
        ong: true,
        raca: true,
        fotos: true,
      },
      where: {
        OR: [
          { nome: { contains: termo, mode: "insensitive" } },
          { especie: { contains: termo, mode: "insensitive" } },
          { cor: { contains: termo, mode: "insensitive" } },
          { raca: { nome: { equals: termo, mode: "insensitive" } } },
          { ong: { nome: { equals: termo, mode: "insensitive" } } },
        ],
      },
    });
    res.status(200).json(pets);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pet = await prisma.pet.findUnique({
      where: { id: Number(id) },
      include: {
        ong: true,
        raca: true,
        fotos: true,
        fotoCapa: true,
      },
    });
    res.status(200).json(pet);
  } catch (error) {
    res.status(400).json(error);
  }
});

// Novo endpoint para marcar pet como adotado
router.patch("/:id/adotar", async (req, res) => {
  const { id } = req.params;

  try {
    const pet = await prisma.pet.update({
      where: { id: Number(id) },
      data: { adotado: true },
      include: {
        ong: true,
        raca: true,
        fotos: true,
      },
    });
    res.status(200).json(pet);
  } catch (error) {
    res.status(400).json({ erro: error });
  }
});

// Rota para buscar pets adotados
router.get("/status/adotados", async (req, res) => {
  try {
    const { page = 1, limit = 20, ongId } = req.query;

    // Construir filtros
    const whereClause: any = {
      adotado: true,
    };

    if (ongId) {
      whereClause.ongId = parseInt(ongId as string);
    }

    // Calcular paginação
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Buscar pets adotados
    const [petsAdotados, totalAdotados] = await Promise.all([
      prisma.pet.findMany({
        where: whereClause,
        include: {
          ong: {
            select: {
              id: true,
              nome: true,
              cidade: true,
              estado: true,
            },
          },
          raca: {
            select: {
              id: true,
              nome: true,
            },
          },
          fotoCapa: true,
          fotos: {
            take: 3, // Limitar número de fotos
          },
          matches: {
            where: {
              status: "ADOTADO",
            },
            include: {
              cliente: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
            take: 1,
            orderBy: {
              updatedAt: "desc",
            },
          },
        },
        orderBy: {
          updatedAt: "desc", // Pets adotados mais recentemente primeiro
        },
        skip,
        take,
      }),
      prisma.pet.count({
        where: whereClause,
      }),
    ]);

    // Calcular estatísticas de adoção
    const estatisticas = await prisma.pet.groupBy({
      by: ["porte", "sexo"],
      where: { adotado: true },
      _count: {
        id: true,
      },
    });

    res.status(200).json({
      pets: petsAdotados,
      paginacao: {
        total: totalAdotados,
        pagina: parseInt(page as string),
        limite: take,
        totalPaginas: Math.ceil(totalAdotados / take),
      },
      estatisticas: {
        totalAdotados,
        porPorte: estatisticas
          .filter((stat) => stat.porte)
          .reduce(
            (acc, stat) => {
              acc[stat.porte] = (acc[stat.porte] || 0) + stat._count.id;
              return acc;
            },
            {} as Record<string, number>
          ),
        porSexo: estatisticas
          .filter((stat) => stat.sexo)
          .reduce(
            (acc, stat) => {
              acc[stat.sexo] = (acc[stat.sexo] || 0) + stat._count.id;
              return acc;
            },
            {} as Record<string, number>
          ),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar pets adotados:", error);
    res.status(500).json({
      erro: "Erro interno do servidor ao buscar pets adotados",
      detalhes: error,
    });
  }
});

// Rota para buscar pets disponíveis para adoção
router.get("/status/disponiveis", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      ongId,
      porte,
      sexo,
      racaId,
      cidade,
      estado,
    } = req.query;

    // Construir filtros
    const whereClause: any = {
      adotado: false, // Pets não adotados
    };

    if (ongId) {
      whereClause.ongId = parseInt(ongId as string);
    }

    if (porte && ["PEQUENO", "MEDIO", "GRANDE"].includes(porte as string)) {
      whereClause.porte = porte;
    }

    if (sexo && ["MACHO", "FEMEA"].includes(sexo as string)) {
      whereClause.sexo = sexo;
    }

    if (racaId) {
      whereClause.racaId = parseInt(racaId as string);
    }

    if (cidade || estado) {
      whereClause.ong = {};
      if (cidade) {
        whereClause.ong.cidade = {
          contains: cidade as string,
          mode: "insensitive",
        };
      }
      if (estado) {
        whereClause.ong.estado = estado as string;
      }
    }

    // Calcular paginação
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    // Buscar pets disponíveis
    const [petsDisponiveis, totalDisponiveis] = await Promise.all([
      prisma.pet.findMany({
        where: whereClause,
        include: {
          ong: {
            select: {
              id: true,
              nome: true,
              cidade: true,
              estado: true,
              telefone: true,
              email: true,
            },
          },
          raca: {
            select: {
              id: true,
              nome: true,
            },
          },
          fotoCapa: true,
          fotos: {
            take: 5,
          },
          curtidas: {
            select: {
              id: true,
              tipo: true,
              cliente: {
                select: {
                  nome: true,
                },
              },
            },
            take: 3,
            orderBy: {
              createdAt: "desc",
            },
          },
          visitas: {
            where: {
              status: {
                in: ["PENDENTE", "CONFIRMADA"],
              },
            },
            select: {
              id: true,
              data: true,
              horario: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc", // Pets mais recentes primeiro
        },
        skip,
        take,
      }),
      prisma.pet.count({
        where: whereClause,
      }),
    ]);

    res.status(200).json({
      pets: petsDisponiveis,
      paginacao: {
        total: totalDisponiveis,
        pagina: parseInt(page as string),
        limite: take,
        totalPaginas: Math.ceil(totalDisponiveis / take),
      },
      filtros: {
        ongId,
        porte,
        sexo,
        racaId,
        cidade,
        estado,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar pets disponíveis:", error);
    res.status(500).json({
      erro: "Erro interno do servidor ao buscar pets disponíveis",
      detalhes: error,
    });
  }
});

export default router;
