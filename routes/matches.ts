import { PrismaClient } from "@prisma/client";
import { Router } from "express";

const prisma = new PrismaClient();
const router = Router();

router.get("/:clienteId", async (req, res) => {
  try {
    const { clienteId } = req.params;

    // Busca visitas aprovadas do cliente
    const matches = await prisma.visita.findMany({
      where: {
        clienteId,
        status: "APROVADO",
      },
      include: {
        pet: {
          include: {
            ong: true,
            fotoCapa: true,
            fotos: true,
          },
        },
      },
      orderBy: { data: "desc" },
    });

    res.status(200).json(matches);
  } catch (error) {
    console.error("Erro ao buscar matches do cliente:", error);
    res.status(500).json({ error: "Erro ao buscar matches do cliente" });
  }
});

export default router;
