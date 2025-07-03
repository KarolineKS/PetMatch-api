import { PrismaClient, StatusVisita } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";

const prisma = new PrismaClient();
const router = Router();

// Schema para horários de funcionamento da ONG
const horarioFuncionamentoSchema = z.object({
  ongId: z.number().int().positive(),
  diaSemana: z.number().min(0).max(6), // 0 = domingo, 6 = sábado
  horaInicio: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM)",
  }),
  horaFim: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM)",
  }),
  intervaloMinutos: z.number().min(15).max(120).default(30), // Duração de cada slot
  maxVisitasSimultaneas: z.number().min(1).max(10).default(2),
  ativo: z.boolean().default(true),
});

// Schema para exceções (feriados, dias especiais)
const excecaoHorarioSchema = z.object({
  ongId: z.number().int().positive(),
  data: z.string().transform((str) => new Date(str)),
  motivo: z
    .string()
    .min(3, { message: "Motivo deve ter pelo menos 3 caracteres" }),
  ativo: z.boolean().default(true), // false = dia normal, true = exceção
});

// 📅 CONFIGURAR HORÁRIOS DE FUNCIONAMENTO DA ONG
router.post("/funcionamento", async (req, res) => {
  try {
    const validatedData = horarioFuncionamentoSchema.parse(req.body);

    // Verifica se já existe horário para este dia da semana
    const horarioExistente = await prisma.horarioFuncionamento.findFirst({
      where: {
        ongId: validatedData.ongId,
        diaSemana: validatedData.diaSemana,
      },
    });

    if (horarioExistente) {
      // Atualiza existente
      const horarioAtualizado = await prisma.horarioFuncionamento.update({
        where: { id: horarioExistente.id },
        data: validatedData,
        include: {
          ong: { select: { nome: true } },
        },
      });
      return res.status(200).json(horarioAtualizado);
    }

    // Cria novo horário
    const novoHorario = await prisma.horarioFuncionamento.create({
      data: validatedData,
      include: {
        ong: { select: { nome: true } },
      },
    });

    res.status(201).json(novoHorario);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Erro ao configurar horário:", error);
    res
      .status(500)
      .json({ error: "Erro ao configurar horário de funcionamento" });
  }
});

// 📝 BUSCAR HORÁRIOS DE FUNCIONAMENTO DE UMA ONG
router.get("/funcionamento/ong/:ongId", async (req, res) => {
  try {
    const { ongId } = req.params;

    const horarios = await prisma.horarioFuncionamento.findMany({
      where: { ongId: parseInt(ongId) },
      orderBy: { diaSemana: "asc" },
      include: {
        ong: { select: { nome: true } },
      },
    });

    // Mapear dias da semana para nomes
    const diasSemana = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];

    const horariosFormatados = horarios.map((h) => ({
      ...h,
      diaSemanaTexto: diasSemana[h.diaSemana],
    }));

    res.status(200).json(horariosFormatados);
  } catch (error) {
    console.error("Erro ao buscar horários:", error);
    res.status(500).json({ error: "Erro ao buscar horários de funcionamento" });
  }
});

// 🚫 ADICIONAR EXCEÇÃO (FERIADO/DIA ESPECIAL)
router.post("/excecao", async (req, res) => {
  try {
    const validatedData = excecaoHorarioSchema.parse(req.body);

    const excecao = await prisma.excecaoHorario.create({
      data: validatedData,
      include: {
        ong: { select: { nome: true } },
      },
    });

    res.status(201).json(excecao);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Erro ao criar exceção:", error);
    res.status(500).json({ error: "Erro ao criar exceção de horário" });
  }
});

// 📋 BUSCAR HORÁRIOS DISPONÍVEIS PARA UMA DATA
router.get("/disponiveis/:ongId/:data", async (req, res) => {
  try {
    const { ongId, data } = req.params;
    const dataConsulta = new Date(data);
    const diaSemana = dataConsulta.getDay(); // 0 = domingo

    console.log(
      `🔍 Buscando horários disponíveis para ONG ${ongId} na data ${data} (dia ${diaSemana})`
    );

    // 1. Verifica se é uma exceção (feriado)
    const excecao = await prisma.excecaoHorario.findFirst({
      where: {
        ongId: parseInt(ongId),
        data: {
          gte: new Date(dataConsulta.setHours(0, 0, 0, 0)),
          lt: new Date(dataConsulta.setHours(23, 59, 59, 999)),
        },
        ativo: true,
      },
    });

    if (excecao) {
      return res.status(200).json({
        disponivel: false,
        motivo: excecao.motivo,
        horarios: [],
      });
    }

    // 2. Busca horário de funcionamento para este dia da semana
    const horarioFuncionamento = await prisma.horarioFuncionamento.findFirst({
      where: {
        ongId: parseInt(ongId),
        diaSemana,
        ativo: true,
      },
    });

    if (!horarioFuncionamento) {
      return res.status(200).json({
        disponivel: false,
        motivo: "ONG não funciona neste dia da semana",
        horarios: [],
      });
    }

    // 3. Gera slots de horário disponíveis
    const horariosDisponiveis = await gerarSlotsDisponiveis(
      parseInt(ongId),
      dataConsulta,
      horarioFuncionamento
    );

    res.status(200).json({
      disponivel: horariosDisponiveis.length > 0,
      horarios: horariosDisponiveis,
      configuracao: {
        horaInicio: horarioFuncionamento.horaInicio,
        horaFim: horarioFuncionamento.horaFim,
        intervalo: horarioFuncionamento.intervaloMinutos,
        maxSimultaneas: horarioFuncionamento.maxVisitasSimultaneas,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar horários disponíveis:", error);
    res.status(500).json({ error: "Erro ao buscar horários disponíveis" });
  }
});

// 🔍 VERIFICAR SE HORÁRIO ESPECÍFICO ESTÁ DISPONÍVEL
router.post("/verificar-disponibilidade", async (req, res) => {
  try {
    const { ongId, data, horario } = req.body;

    if (!ongId || !data || !horario) {
      return res.status(400).json({
        error: "ongId, data e horario são obrigatórios",
      });
    }

    const disponivel = await verificarHorarioDisponivel(
      parseInt(ongId),
      new Date(data),
      horario
    );

    res.status(200).json({ disponivel });
  } catch (error) {
    console.error("Erro ao verificar disponibilidade:", error);
    res.status(500).json({ error: "Erro ao verificar disponibilidade" });
  }
});

// 📊 RELATÓRIO DE OCUPAÇÃO
router.get("/relatorio/:ongId/:dataInicio/:dataFim", async (req, res) => {
  try {
    const { ongId, dataInicio, dataFim } = req.params;

    const visitas = await prisma.visita.findMany({
      where: {
        pet: { ongId: parseInt(ongId) },
        data: {
          gte: new Date(dataInicio),
          lte: new Date(dataFim),
        },
        status: {
          in: [
            StatusVisita.PENDENTE,
            StatusVisita.CONFIRMADA,
            StatusVisita.CONCLUIDA,
          ],
        },
      },
      select: {
        data: true,
        horario: true,
        status: true,
        cliente: { select: { nome: true } },
        pet: { select: { nome: true } },
      },
      orderBy: [{ data: "asc" }, { horario: "asc" }],
    });

    // Agrupa por data
    const visitasPorData = visitas.reduce((acc: any, visita) => {
      const dataStr = visita.data.toISOString().split("T")[0];
      if (!acc[dataStr]) {
        acc[dataStr] = [];
      }
      acc[dataStr].push(visita);
      return acc;
    }, {});

    res.status(200).json({
      periodo: { inicio: dataInicio, fim: dataFim },
      totalVisitas: visitas.length,
      visitasPorData,
    });
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    res.status(500).json({ error: "Erro ao gerar relatório de ocupação" });
  }
});

// 🔧 FUNÇÕES AUXILIARES

async function gerarSlotsDisponiveis(ongId: number, data: Date, config: any) {
  const slots = [];
  const [horaInicio, minutoInicio] = config.horaInicio.split(":").map(Number);
  const [horaFim, minutoFim] = config.horaFim.split(":").map(Number);

  const inicioMinutos = horaInicio * 60 + minutoInicio;
  const fimMinutos = horaFim * 60 + minutoFim;

  for (
    let minutos = inicioMinutos;
    minutos < fimMinutos;
    minutos += config.intervaloMinutos
  ) {
    const hora = Math.floor(minutos / 60);
    const minuto = minutos % 60;
    const horarioStr = `${hora.toString().padStart(2, "0")}:${minuto
      .toString()
      .padStart(2, "0")}`;

    // Verifica se este horário está disponível
    const disponivel = await verificarHorarioDisponivel(
      ongId,
      data,
      horarioStr
    );

    if (disponivel) {
      slots.push({
        horario: horarioStr,
        disponivel: true,
      });
    }
  }

  return slots;
}

async function verificarHorarioDisponivel(
  ongId: number,
  data: Date,
  horario: string
): Promise<boolean> {
  try {
    // Busca configuração para este dia da semana
    const config = await prisma.horarioFuncionamento.findFirst({
      where: {
        ongId,
        diaSemana: data.getDay(),
        ativo: true,
      },
    });

    if (!config) return false;

    // Conta quantas visitas já estão agendadas neste horário
    const visitasNoHorario = await prisma.visita.count({
      where: {
        pet: { ongId },
        data: {
          gte: new Date(data.setHours(0, 0, 0, 0)),
          lt: new Date(data.setHours(23, 59, 59, 999)),
        },
        horario,
        status: { in: [StatusVisita.PENDENTE, StatusVisita.CONFIRMADA] },
      },
    });

    return visitasNoHorario < config.maxVisitasSimultaneas;
  } catch (error) {
    console.error("Erro ao verificar disponibilidade:", error);
    return false;
  }
}

export default router;
