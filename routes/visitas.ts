import { PrismaClient, StatusVisita } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

const prisma = new PrismaClient();
const router = Router();

// Schema corrigido para validação
const visitaSchema = z.object({
  clienteId: z.string().uuid("ID do cliente deve ser um UUID válido"),
  petId: z.number().int().positive("ID do pet deve ser um número positivo"),
  data: z.string().transform((str) => {
    const date = new Date(str);
    if (isNaN(date.getTime())) {
      throw new Error("Data inválida");
    }
    return date;
  }),
  horario: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Horário deve estar no formato HH:MM (ex: 14:30)",
  }),
  status: z.nativeEnum(StatusVisita).default(StatusVisita.PENDENTE),
});

// Schema para atualização de status
const statusUpdateSchema = z.object({
  status: z.nativeEnum(StatusVisita),
});

// GET - Listar todas as visitas
router.get("/", async (req, res) => {
  try {
    console.log("Buscando visitas...");
    const visitas = await prisma.visita.findMany({
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        pet: {
          include: {
            ong: {
              select: {
                id: true,
                nome: true,
              },
            },
            fotoCapa: true,
            raca: true,
          },
        },
      },
      orderBy: { data: "desc" },
    });
    console.log("Visitas encontradas:", visitas.length);
    res.status(200).json(visitas);
  } catch (error) {
    console.error("Erro ao buscar visitas:", error);
    res.status(500).json({ error: "Erro ao buscar visitas" });
  }
});

// POST - Criar nova visita
router.post("/", async (req, res) => {
  try {
    console.log("=== CRIANDO VISITA ===");
    console.log("Dados recebidos:", req.body);

    // Validar dados de entrada
    const validatedData = visitaSchema.parse(req.body);
    console.log("Dados validados:", validatedData);

    // Verificar se o cliente existe
    const clienteExiste = await prisma.cliente.findUnique({
      where: { id: validatedData.clienteId },
    });

    if (!clienteExiste) {
      return res.status(404).json({
        error: "Cliente não encontrado",
      });
    }

    // Verificar se o pet existe
    const petExiste = await prisma.pet.findUnique({
      where: { id: validatedData.petId },
    });

    if (!petExiste) {
      return res.status(404).json({
        error: "Pet não encontrado",
      });
    }

    // Verificar se o pet já foi adotado
    if (petExiste.adotado) {
      return res.status(400).json({
        error: "Este pet já foi adotado",
      });
    }

    // Verificar se já existe uma visita PENDENTE ou CONFIRMADA para este cliente e pet
    const visitaExistente = await prisma.visita.findFirst({
      where: {
        clienteId: validatedData.clienteId,
        petId: validatedData.petId,
        status: {
          in: [StatusVisita.PENDENTE, StatusVisita.CONFIRMADA],
        },
      },
    });

    if (visitaExistente) {
      return res.status(400).json({
        error: "Você já possui uma visita pendente ou confirmada para este pet",
      });
    }

    // Verificar se a data/horário não é no passado
    const agora = new Date();
    const dataVisita = new Date(
      `${validatedData.data.toISOString().split("T")[0]}T${
        validatedData.horario
      }:00`
    );

    if (dataVisita <= agora) {
      return res.status(400).json({
        error: "Não é possível agendar visitas para datas/horários passados",
      });
    }

    // Criar a visita
    const visita = await prisma.visita.create({
      data: {
        clienteId: validatedData.clienteId,
        petId: validatedData.petId,
        data: validatedData.data,
        horario: validatedData.horario,
        status: validatedData.status,
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        pet: {
          include: {
            ong: {
              select: {
                id: true,
                nome: true,
              },
            },
            fotoCapa: true,
            raca: true,
          },
        },
      },
    });

    console.log("Visita criada com sucesso:", visita.id);
    res.status(201).json(visita);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Erro de validação Zod:", error.errors);
      return res.status(400).json({
        error: "Dados inválidos",
        details: error.errors.map((err) => ({
          campo: err.path.join("."),
          mensagem: err.message,
        })),
      });
    }
    console.error("Erro ao criar visita:", error);
    res.status(500).json({ error: "Erro interno do servidor ao criar visita" });
  }
});

// PATCH - Atualizar status da visita
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;

    // Validar dados
    const { status } = statusUpdateSchema.parse(req.body);

    // Verificar se a visita existe
    const visitaExistente = await prisma.visita.findUnique({
      where: { id },
    });

    if (!visitaExistente) {
      return res.status(404).json({ error: "Visita não encontrada" });
    }

    const visita = await prisma.visita.update({
      where: { id },
      data: { status },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
        pet: {
          include: {
            ong: {
              select: {
                id: true,
                nome: true,
              },
            },
            fotoCapa: true,
            raca: true,
          },
        },
      },
    });

    res.status(200).json(visita);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Status inválido",
        details: error.errors,
      });
    }
    console.error("Erro ao atualizar visita:", error);
    res.status(500).json({ error: "Erro ao atualizar status da visita" });
  }
});

// GET - Buscar visitas de um cliente específico
router.get("/cliente/:clienteId", async (req, res) => {
  try {
    const { clienteId } = req.params;

    // Verificar se o cliente existe
    const clienteExiste = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!clienteExiste) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    const visitas = await prisma.visita.findMany({
      where: { clienteId },
      include: {
        pet: {
          include: {
            ong: {
              select: {
                id: true,
                nome: true,
              },
            },
            fotoCapa: true,
            raca: true,
          },
        },
      },
      orderBy: { data: "desc" },
    });

    res.status(200).json(visitas);
  } catch (error) {
    console.error("Erro ao buscar visitas do cliente:", error);
    res.status(500).json({ error: "Erro ao buscar visitas do cliente" });
  }
});

// DELETE - Deletar visita
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a visita existe
    const visitaExistente = await prisma.visita.findUnique({
      where: { id },
    });

    if (!visitaExistente) {
      return res.status(404).json({ error: "Visita não encontrada" });
    }

    await prisma.visita.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar visita:", error);
    res.status(500).json({ error: "Erro ao deletar visita" });
  }
});

export default router;
