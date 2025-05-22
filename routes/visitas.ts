import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

const prisma = new PrismaClient();
const router = Router();

const visitaSchema = z.object({
  clienteId: z.string(),
  petId: z.number().int().positive(),
  local: z.string().min(5, {
    message: "Local deve ter no mínimo 5 caracteres",
  }),
  status: z.string().default("PENDENTE"),
});

router.get("/", async (req, res) => {
  try {
    const visitas = await prisma.visita.findMany({
      include: {
        cliente: true,
        pet: {
          include: {
            ong: true,
            fotoCapa: true,
          },
        },
      },
      orderBy: { data: "desc" },
    });
    res.status(200).json(visitas);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar visitas" });
  }
});

router.post("/", async (req, res) => {
  try {
    const data = visitaSchema.parse(req.body);
    const visita = await prisma.visita.create({
      data,
      include: {
        cliente: true,
        pet: true,
      },
    });
    res.status(201).json(visita);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Erro ao criar visita" });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status é obrigatório" });
    }

    const visita = await prisma.visita.update({
      where: { id },
      data: { status },
      include: {
        cliente: true,
        pet: true,
      },
    });

    res.status(200).json(visita);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar status da visita" });
  }
});

router.get("/cliente/:clienteId", async (req, res) => {
  try {
    const { clienteId } = req.params;
    const visitas = await prisma.visita.findMany({
      where: { clienteId },
      include: {
        pet: {
          include: {
            ong: true,
            fotoCapa: true,
          },
        },
      },
      orderBy: { data: "desc" },
    });
    res.status(200).json(visitas);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar visitas do cliente" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.visita.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar visita" });
  }
});

export default router;
