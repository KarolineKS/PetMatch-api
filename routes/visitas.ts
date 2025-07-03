import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

const prisma = new PrismaClient();
const router = Router();

const visitaSchema = z.object({
  clienteId: z.string(),
  petId: z.number().int().positive(),
  data: z.string().transform((str) => new Date(str)),
  horario: z.string().min(3, {
    message: "Horário deve ter no mínimo 3 caracteres",
  }),
  status: z.string().default("PENDENTE"),
});

router.get("/", async (req, res) => {
  try {
    console.log("Buscando visitas...");
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
    console.log("Visitas encontradas:", visitas.length);
    res.status(200).json(visitas);
  } catch (error) {
    console.error("Erro ao buscar visitas:", error);
    res.status(500).json({ error: "Erro ao buscar visitas" });
  }
});

router.post("/", async (req, res) => {
  try {
    const validatedData = visitaSchema.parse(req.body);

    // Verifica se já existe uma visita para este cliente e pet
    const visitaExistente = await prisma.visita.findFirst({
      where: {
        clienteId: validatedData.clienteId,
        petId: validatedData.petId,
      },
    });

    if (visitaExistente) {
      return res.status(400).json({
        error: "Você já agendou uma visita para este pet",
      });
    }

    const visita = await prisma.visita.create({
      data: {
        clienteId: validatedData.clienteId,
        petId: validatedData.petId,
        data: validatedData.data,
        horario: validatedData.horario,
        status: validatedData.status,
      },
      include: {
        cliente: true,
        pet: true,
      },
    });
    res.status(201).json(visita);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Erro de validação Zod:", error.errors);
      return res.status(400).json({ error: error.errors });
    }
    console.error("Erro ao criar visita:", error);
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
