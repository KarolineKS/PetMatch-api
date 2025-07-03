import { PrismaClient, StatusMatch } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

const prisma = new PrismaClient();
const router = Router();

const matchSchema = z.object({
  clienteId: z.string().uuid(),
  petId: z.number().int().positive(),
  status: z.nativeEnum(StatusMatch).default(StatusMatch.ATIVO),
});

// Buscar matches de um cliente
router.get("/cliente/:clienteId", async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { status } = req.query;

    const whereClause: any = { clienteId };
    if (status) {
      whereClause.status = status;
    }

    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        cliente: { select: { id: true, nome: true, email: true } },
        pet: {
          include: {
            ong: {
              select: { id: true, nome: true, email: true, telefone: true },
            },
            fotoCapa: true,
            fotos: true,
            raca: { select: { nome: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(matches);
  } catch (error) {
    console.error("Erro ao buscar matches do cliente:", error);
    res.status(500).json({ error: "Erro ao buscar matches do cliente" });
  }
});

// Buscar matches de uma ONG (pets que tiveram match)
router.get("/ong/:ongId", async (req, res) => {
  try {
    const { ongId } = req.params;
    const { status } = req.query;

    // Buscar pets da ONG que tiveram matches
    const whereClause: any = {
      pet: { ongId: parseInt(ongId) },
    };
    if (status) {
      whereClause.status = status;
    }

    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        cliente: { select: { id: true, nome: true, email: true } },
        pet: {
          include: {
            fotoCapa: true,
            raca: { select: { nome: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(matches);
  } catch (error) {
    console.error("Erro ao buscar matches da ONG:", error);
    res.status(500).json({ error: "Erro ao buscar matches da ONG" });
  }
});

// Criar match manual (para casos especiais)
router.post("/", async (req, res) => {
  try {
    const validatedData = matchSchema.parse(req.body);

    // Verifica se já existe match
    const matchExistente = await prisma.match.findFirst({
      where: {
        clienteId: validatedData.clienteId,
        petId: validatedData.petId,
      },
    });

    if (matchExistente) {
      return res.status(400).json({
        error: "Match já existe para este cliente e pet",
      });
    }

    const novoMatch = await prisma.match.create({
      data: validatedData,
      include: {
        cliente: { select: { id: true, nome: true } },
        pet: {
          include: {
            ong: { select: { id: true, nome: true } },
            fotoCapa: true,
          },
        },
      },
    });

    res.status(201).json(novoMatch);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Erro ao criar match:", error);
    res.status(500).json({ error: "Erro ao criar match" });
  }
});

// Atualizar status de um match
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(StatusMatch).includes(status)) {
      return res.status(400).json({
        error: "Status deve ser ATIVO, INATIVO ou ADOTADO",
      });
    }

    const matchAtualizado = await prisma.match.update({
      where: { id },
      data: { status },
      include: {
        cliente: { select: { id: true, nome: true } },
        pet: {
          include: {
            ong: { select: { id: true, nome: true } },
            fotoCapa: true,
          },
        },
      },
    });

    res.status(200).json(matchAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar match:", error);
    res.status(500).json({ error: "Erro ao atualizar match" });
  }
});

// Remover match
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.match.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao remover match:", error);
    res.status(500).json({ error: "Erro ao remover match" });
  }
});

// Estatísticas de matches
router.get("/stats/resumo", async (req, res) => {
  try {
    const stats = await Promise.all([
      // Total de matches ativos
      prisma.match.count({ where: { status: StatusMatch.ATIVO } }),

      // Total de adoções (matches com status ADOTADO)
      prisma.match.count({ where: { status: StatusMatch.ADOTADO } }),

      // Matches por mês (últimos 6 meses)
      prisma.match.groupBy({
        by: ["createdAt"],
        _count: { id: true },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000), // 6 meses atrás
          },
        },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    res.status(200).json({
      matchesAtivos: stats[0],
      adocoes: stats[1],
      matchesPorMes: stats[2],
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

export default router;
