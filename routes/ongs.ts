import { PrismaClient } from "@prisma/client";
import { Router, Request, Response } from "express";
import { z } from "zod";
import { verificaTokenENivel } from "../middleware/verificaToken";

const prisma = new PrismaClient();
const router = Router();

// Schema para validação dos horários de funcionamento
const horarioFuncionamentoSchema = z.object({
  diaSemana: z.number().min(0).max(6),
  horaInicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Hora de início deve estar no formato HH:MM (ex: 09:00)",
  }),
  horaFim: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Hora de fim deve estar no formato HH:MM (ex: 18:00)",
  }),
  intervaloMinutos: z.number().min(15).max(120),
  maxVisitasSimultaneas: z.number().min(1).max(10),
});

// Schema para validação da ONG
const ongSchema = z.object({
  nome: z.string().min(3).max(100),
  cnpj: z.string().regex(/^\d{14}$/, {
    message: "CNPJ deve conter 14 dígitos numéricos",
  }),
  telefone: z.string().regex(/^\d{10,11}$/, {
    message: "Telefone deve conter 10 ou 11 dígitos numéricos",
  }),
  email: z.string().email(),
  site: z.string().url().optional(),
  endereco: z.string().min(5).max(200),
  cidade: z.string().min(2).max(100),
  estado: z.string().length(2),
  cep: z.string().regex(/^\d{8}$/, {
    message: "CEP deve conter 8 dígitos numéricos",
  }),
  horariosFuncionamento: z.array(horarioFuncionamentoSchema).min(1),
});

// POST - Cadastrar nova ONG com horários
router.post(
  "/",
  verificaTokenENivel(2),
  async (req: Request, res: Response) => {
    try {
      console.log("=== CADASTRANDO NOVA ONG ===");
      console.log("Dados recebidos:", req.body);

      // Validar dados de entrada
      const validatedData = ongSchema.parse(req.body);

      // Verificar se já existe ONG com mesmo CNPJ
      const ongExistente = await prisma.ong.findFirst({
        where: { cnpj: validatedData.cnpj },
      });

      if (ongExistente) {
        return res.status(400).json({
          error: "Já existe uma ONG cadastrada com este CNPJ",
        });
      }

      // Criar ONG e seus horários em uma transação
      const novaOng = await prisma.$transaction(async (tx) => {
        // Criar a ONG
        const ong = await tx.ong.create({
          data: {
            nome: validatedData.nome,
            cnpj: validatedData.cnpj,
            telefone: validatedData.telefone,
            email: validatedData.email,
            site: validatedData.site,
            endereco: validatedData.endereco,
            cidade: validatedData.cidade,
            estado: validatedData.estado,
            cep: validatedData.cep,
          },
        });

        // Criar os horários de funcionamento
        const horarios = await Promise.all(
          validatedData.horariosFuncionamento.map((horario) =>
            tx.horarioFuncionamento.create({
              data: {
                ...horario,
                ongId: ong.id,
              },
            })
          )
        );

        return {
          ...ong,
          horariosFuncionamento: horarios,
        };
      });

      console.log("ONG cadastrada com sucesso:", novaOng.id);
      res.status(201).json(novaOng);
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
      console.error("Erro ao cadastrar ONG:", error);
      res
        .status(500)
        .json({ error: "Erro interno do servidor ao cadastrar ONG" });
    }
  }
);

// GET - Listar todas as ONGs com seus horários
router.get("/", async (req: Request, res: Response) => {
  try {
    const ongs = await prisma.ong.findMany({
      include: {
        horariosFuncionamento: true,
        _count: {
          select: { pets: true },
        },
      },
    });

    const ongsFormatadas = ongs.map((ong) => ({
      ...ong,
      totalPets: ong._count.pets,
      _count: undefined,
    }));

    res.status(200).json(ongsFormatadas);
  } catch (error) {
    console.error("Erro ao listar ONGs:", error);
    res.status(500).json({ error: "Erro ao listar ONGs" });
  }
});

// GET - Buscar ONG específica com seus horários
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const ong = await prisma.ong.findUnique({
      where: { id: parseInt(id) },
      include: {
        horariosFuncionamento: true,
        pets: {
          include: {
            fotoCapa: true,
            raca: true,
          },
        },
      },
    });

    if (!ong) {
      return res.status(404).json({ error: "ONG não encontrada" });
    }

    res.status(200).json(ong);
  } catch (error) {
    console.error("Erro ao buscar ONG:", error);
    res.status(500).json({ error: "Erro ao buscar ONG" });
  }
});

export default router;
