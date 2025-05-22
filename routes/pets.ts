import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

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

router.post("/", async (req, res) => {
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
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const pet = await prisma.pet.delete({
      where: { id: Number(id) },
    });
    res.status(200).json(pet);
  } catch (error) {
    res.status(400).json({ erro: error });
  }
});

router.put("/:id", async (req, res) => {
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
});

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

export default router;
