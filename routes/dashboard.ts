import { PrismaClient, StatusVisita } from "@prisma/client";
import { Router, Request, Response } from "express";
import { verificaTokenENivel } from "../middleware/verificaToken";

const prisma = new PrismaClient();
const router = Router();

// Dashboard principal - todas as estatísticas
router.get("/", verificaTokenENivel(2), async (req: Request, res: Response) => {
  try {
    // Total de pets
    const totalPets = await prisma.pet.count();

    // Total de clientes
    const totalClientes = await prisma.cliente.count();

    // Total de visitas
    const totalVisitas = await prisma.visita.count();

    // Pets adotados
    const petsAdotados = await prisma.pet.count({
      where: { adotado: true },
    });

    // Visitas pendentes
    const visitasPendentes = await prisma.visita.count({
      where: { status: StatusVisita.PENDENTE },
    });

    // Raças com contagem de pets
    const racas = await prisma.raca.findMany({
      include: {
        _count: {
          select: { pets: true },
        },
      },
      orderBy: {
        pets: {
          _count: "desc",
        },
      },
    });

    // ONGs com contagem de pets
    const ongs = await prisma.ong.findMany({
      include: {
        _count: {
          select: { pets: true },
        },
      },
      orderBy: {
        pets: {
          _count: "desc",
        },
      },
    });

    const dashboardData = {
      totais: {
        totalPets,
        totalClientes,
        totalVisitas,
        petsAdotados,
        visitasPendentes,
      },
      racas: racas.map((raca) => ({
        id: raca.id,
        nome: raca.nome,
        totalPets: raca._count.pets,
      })),
      ongs: ongs.map((ong) => ({
        id: ong.id,
        nome: ong.nome,
        totalPets: ong._count.pets,
        cidade: ong.cidade,
        estado: ong.estado,
      })),
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
});

// Endpoint específico para total de pets
router.get(
  "/totalPets",
  verificaTokenENivel(2),
  async (req: Request, res: Response) => {
    try {
      const totalPets = await prisma.pet.count();
      res.status(200).json({ totalPets });
    } catch (error) {
      res.status(500).json({ erro: "Erro ao buscar total de pets" });
    }
  }
);

// Endpoint específico para total de clientes
router.get(
  "/totalClientes",
  verificaTokenENivel(2),
  async (req: Request, res: Response) => {
    try {
      const totalClientes = await prisma.cliente.count();
      res.status(200).json({ totalClientes });
    } catch (error) {
      res.status(500).json({ erro: "Erro ao buscar total de clientes" });
    }
  }
);

// Endpoint específico para total de visitas
router.get(
  "/totalVisitas",
  verificaTokenENivel(2),
  async (req: Request, res: Response) => {
    try {
      const totalVisitas = await prisma.visita.count();
      res.status(200).json({ totalVisitas });
    } catch (error) {
      res.status(500).json({ erro: "Erro ao buscar total de visitas" });
    }
  }
);

// Endpoint específico para pets adotados
router.get(
  "/petsAdotados",
  verificaTokenENivel(2),
  async (req: Request, res: Response) => {
    try {
      const petsAdotados = await prisma.pet.count({
        where: { adotado: true },
      });
      res.status(200).json({ petsAdotados });
    } catch (error) {
      res.status(500).json({ erro: "Erro ao buscar pets adotados" });
    }
  }
);

// Endpoint específico para visitas pendentes
router.get(
  "/visitasPendentes",
  verificaTokenENivel(2),
  async (req: Request, res: Response) => {
    try {
      const visitasPendentes = await prisma.visita.count({
        where: { status: StatusVisita.PENDENTE },
      });
      res.status(200).json({ visitasPendentes });
    } catch (error) {
      res.status(500).json({ erro: "Erro ao buscar visitas pendentes" });
    }
  }
);

// Endpoint específico para raças
router.get(
  "/racas",
  verificaTokenENivel(2),
  async (req: Request, res: Response) => {
    try {
      const racas = await prisma.raca.findMany({
        include: {
          _count: {
            select: { pets: true },
          },
          pets: {
            select: {
              id: true,
              nome: true,
              adotado: true,
            },
          },
        },
        orderBy: {
          pets: {
            _count: "desc",
          },
        },
      });

      const racasData = racas.map((raca) => ({
        id: raca.id,
        nome: raca.nome,
        totalPets: raca._count.pets,
        petsDisponiveis: raca.pets.filter((pet) => !pet.adotado).length,
        petsAdotados: raca.pets.filter((pet) => pet.adotado).length,
      }));

      res.status(200).json(racasData);
    } catch (error) {
      res.status(500).json({ erro: "Erro ao buscar dados das raças" });
    }
  }
);

// Endpoint específico para ONGs
router.get(
  "/ongs",
  verificaTokenENivel(2),
  async (req: Request, res: Response) => {
    try {
      const ongs = await prisma.ong.findMany({
        include: {
          _count: {
            select: { pets: true },
          },
          pets: {
            select: {
              id: true,
              nome: true,
              adotado: true,
            },
          },
        },
        orderBy: {
          pets: {
            _count: "desc",
          },
        },
      });

      const ongsData = ongs.map((ong) => ({
        id: ong.id,
        nome: ong.nome,
        cnpj: ong.cnpj,
        telefone: ong.telefone,
        email: ong.email,
        endereco: ong.endereco,
        cidade: ong.cidade,
        estado: ong.estado,
        totalPets: ong._count.pets,
        petsDisponiveis: ong.pets.filter((pet) => !pet.adotado).length,
        petsAdotados: ong.pets.filter((pet) => pet.adotado).length,
      }));

      res.status(200).json(ongsData);
    } catch (error) {
      res.status(500).json({ erro: "Erro ao buscar dados das ONGs" });
    }
  }
);

// Endpoint para estatísticas avançadas
router.get(
  "/estatisticas",
  verificaTokenENivel(2),
  async (req: Request, res: Response) => {
    try {
      // Pets por porte
      const petsPorPorte = await prisma.pet.groupBy({
        by: ["porte"],
        _count: {
          id: true,
        },
      });

      // Pets por sexo
      const petsPorSexo = await prisma.pet.groupBy({
        by: ["sexo"],
        _count: {
          id: true,
        },
      });

      // Visitas por status
      const visitasPorStatus = await prisma.visita.groupBy({
        by: ["status"],
        _count: {
          id: true,
        },
      });

      // Pets adotados nos últimos 30 dias
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 30);

      const adocoesRecentes = await prisma.pet.count({
        where: {
          adotado: true,
          updatedAt: {
            gte: dataLimite,
          },
        },
      });

      res.status(200).json({
        petsPorPorte,
        petsPorSexo,
        visitasPorStatus,
        adocoesRecentes,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({ erro: "Erro ao buscar estatísticas" });
    }
  }
);

export default router;
