import { PrismaClient, TipoCurtida } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

const prisma = new PrismaClient();
const router = Router();

const curtidaSchema = z.object({
  clienteId: z.string().uuid(),
  petId: z.number().int().positive(),
  tipo: z.nativeEnum(TipoCurtida).default(TipoCurtida.LIKE),
});

// Dar curtida em um pet
router.post("/", async (req, res) => {
  try {
    const validatedData = curtidaSchema.parse(req.body);

    // Verifica se já existe curtida para este cliente e pet
    const curtidaExistente = await prisma.curtida.findFirst({
      where: {
        clienteId: validatedData.clienteId,
        petId: validatedData.petId,
      },
    });

    if (curtidaExistente) {
      // Se já existe, atualiza o tipo
      const curtidaAtualizada = await prisma.curtida.update({
        where: { id: curtidaExistente.id },
        data: { tipo: validatedData.tipo },
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

      // Verifica se criou um match
      await verificarMatch(validatedData.clienteId, validatedData.petId);

      return res.status(200).json(curtidaAtualizada);
    }

    // Cria nova curtida
    const novaCurtida = await prisma.curtida.create({
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

    // Verifica se criou um match
    if (validatedData.tipo === TipoCurtida.LIKE) {
      await verificarMatch(validatedData.clienteId, validatedData.petId);
    }

    res.status(201).json(novaCurtida);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Erro ao criar curtida:", error);
    res.status(500).json({ error: "Erro ao criar curtida" });
  }
});

// Listar curtidas de um cliente
router.get("/cliente/:clienteId", async (req, res) => {
  try {
    const { clienteId } = req.params;
    const { tipo } = req.query;

    const whereClause: any = { clienteId };
    if (tipo && (tipo === "LIKE" || tipo === "DISLIKE")) {
      whereClause.tipo = tipo;
    }

    const curtidas = await prisma.curtida.findMany({
      where: whereClause,
      include: {
        pet: {
          include: {
            ong: { select: { id: true, nome: true } },
            fotoCapa: true,
            raca: { select: { nome: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(curtidas);
  } catch (error) {
    console.error("Erro ao buscar curtidas:", error);
    res.status(500).json({ error: "Erro ao buscar curtidas" });
  }
});

// Listar pets que curtiram um cliente (para ONGs)
router.get("/pet/:petId", async (req, res) => {
  try {
    const { petId } = req.params;

    const curtidas = await prisma.curtida.findMany({
      where: {
        petId: parseInt(petId),
        tipo: TipoCurtida.LIKE,
      },
      include: {
        cliente: { select: { id: true, nome: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(curtidas);
  } catch (error) {
    console.error("Erro ao buscar curtidas do pet:", error);
    res.status(500).json({ error: "Erro ao buscar curtidas do pet" });
  }
});

// Remover curtida
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const curtida = await prisma.curtida.findUnique({
      where: { id },
      include: { pet: true },
    });

    if (!curtida) {
      return res.status(404).json({ error: "Curtida não encontrada" });
    }

    await prisma.curtida.delete({
      where: { id },
    });

    // Remove match se existir
    await prisma.match.deleteMany({
      where: {
        clienteId: curtida.clienteId,
        petId: curtida.petId,
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao remover curtida:", error);
    res.status(500).json({ error: "Erro ao remover curtida" });
  }
});

// Função auxiliar para verificar match
async function verificarMatch(clienteId: string, petId: number) {
  try {
    // Verifica se o cliente curtiu o pet
    const curtidaCliente = await prisma.curtida.findFirst({
      where: {
        clienteId,
        petId,
        tipo: TipoCurtida.LIKE,
      },
    });

    if (!curtidaCliente) return;

    // Busca o pet para pegar a ONG
    const pet = await prisma.pet.findUnique({
      where: { id: petId },
      include: { ong: true },
    });

    if (!pet) return;

    // Verifica se a ONG também "curtiu" o cliente
    // (isso seria através de aprovar uma visita ou algum outro critério)
    const visitaConfirmada = await prisma.visita.findFirst({
      where: {
        clienteId,
        petId,
        status: "CONFIRMADA",
      },
    });

    // Se há curtida do cliente E visita confirmada pela ONG = MATCH!
    if (visitaConfirmada) {
      // Verifica se o match já existe
      const matchExistente = await prisma.match.findFirst({
        where: {
          clienteId,
          petId,
        },
      });

      if (!matchExistente) {
        await prisma.match.create({
          data: {
            clienteId,
            petId,
            status: "ATIVO",
          },
        });

        console.log(`🎉 MATCH criado! Cliente ${clienteId} com Pet ${petId}`);
      }
    }
  } catch (error) {
    console.error("Erro ao verificar match:", error);
  }
}

export default router;
