import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";

const prisma = new PrismaClient();
const router = Router();

const resetPasswordSchema = z.object({
  token: z.string(),
  novaSenha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

router.post("/", async (req, res) => {
  const { email, senha } = req.body;

  // em termos de segurança, o recomendado é exibir uma mensagem padrão
  // a fim de evitar de dar "dicas" sobre o processo de login para hackers
  const mensaPadrao = "Login ou senha incorretos";

  if (!email || !senha) {
    // res.status(400).json({ erro: "Informe e-mail e senha do usuário" })
    res.status(400).json({ erro: mensaPadrao });
    return;
  }

  try {
    const cliente = await prisma.cliente.findFirst({
      where: { email },
    });

    if (cliente == null) {
      // res.status(400).json({ erro: "E-mail inválido" })
      res.status(400).json({ erro: mensaPadrao });
      return;
    }

    // se o e-mail existe, faz-se a comparação dos hashs
    if (bcrypt.compareSync(senha, cliente.senha)) {
      // se confere, gera e retorna o token
      const token = jwt.sign(
        {
          clienteLogadoId: cliente.id,
          clienteLogadoNome: cliente.nome,
        },
        process.env.JWT_KEY as string,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email,
        token,
      });
    } else {
      res.status(400).json({ erro: mensaPadrao });
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

// Rota para redefinir senha
router.post("/reset-password", async (req, res) => {
  try {
    const { token, novaSenha } = resetPasswordSchema.parse(req.body);

    const decoded = jwt.verify(token, process.env.JWT_KEY!) as any;

    const cliente = await prisma.cliente.findUnique({
      where: { id: decoded.clienteId },
    });

    if (!cliente) {
      return res.status(400).json({ error: "Token inválido" });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 12);

    await prisma.cliente.update({
      where: { id: cliente.id },
      data: { senha: senhaHash },
    });

    res.status(200).json({ message: "Senha redefinida com sucesso" });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({ error: "Token inválido ou expirado" });
    }
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Erro ao redefinir senha:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
