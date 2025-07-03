import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Estender a interface Request para incluir dados do admin
declare global {
  namespace Express {
    interface Request {
      adminLogado?: {
        id: string;
        nome: string;
        nivel: number;
      };
    }
  }
}

// Middleware para verificar se o token JWT é válido
export function verificaToken(req: Request, res: Response, next: NextFunction) {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ erro: "Token de acesso não informado" });
  }

  const token = authorization.split(" ")[1]; // Remove "Bearer " do token

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY as string) as any;

    // Adiciona os dados do admin logado ao request
    req.adminLogado = {
      id: decoded.adminLogadoId,
      nome: decoded.adminLogadoNome,
      nivel: decoded.adminLogadoNivel,
    };

    next();
  } catch (error) {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

// Middleware para verificar nível de acesso (nível 3 = máximo acesso)
export function verificaNivel(nivelMinimo: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.adminLogado) {
      return res.status(401).json({ erro: "Acesso não autorizado" });
    }

    // Nível 3 é o mais alto, então verificamos se o nível é menor que o mínimo
    if (req.adminLogado.nivel < nivelMinimo) {
      return res.status(403).json({
        erro: `Acesso negado. Nível mínimo necessário: ${nivelMinimo}. Seu nível: ${req.adminLogado.nivel}`,
      });
    }

    next();
  };
}

// Middleware combinado: verifica token e nível
export function verificaTokenENivel(nivelMinimo: number) {
  return [verificaToken, verificaNivel(nivelMinimo)];
}
