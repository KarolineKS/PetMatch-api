import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();
const router = Router();

// Configurar Nodemailer com Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  novaSenha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

// Rota para solicitar reset de senha
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    // Verificar se o cliente existe
    const cliente = await prisma.cliente.findFirst({
      where: { email },
    });

    if (!cliente) {
      return res.status(200).json({
        message:
          "Se o email existir, você receberá instruções para redefinir sua senha",
      });
    }

    // Gerar token de reset (válido por 1 hora)
    const resetToken = jwt.sign(
      { clienteId: cliente.id, email: cliente.email },
      process.env.JWT_KEY!,
      { expiresIn: "1h" }
    );

    // Criar link de reset
    const resetLink = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    // Configurar email
    const mailOptions = {
      from: `"PetMatch" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Redefinir senha - PetMatch",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Redefinir sua senha</h2>
          <p>Olá, ${cliente.nome}!</p>
          <p>Você solicitou a redefinição de sua senha no PetMatch.</p>
          <p>Clique no botão abaixo para redefinir sua senha:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Redefinir Senha
            </a>
          </div>
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="word-break: break-all; color: #666;">${resetLink}</p>
          <p><strong>Este link expira em 1 hora.</strong></p>
          <p>Se você não solicitou esta redefinição, ignore este email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Este é um email automático, não responda.
          </p>
        </div>
      `,
    };

    console.log("Tentando enviar email...");

    try {
      // Enviar email real com Gmail
      await transporter.sendMail(mailOptions);
      console.log("Email enviado com sucesso!");
    } catch (emailError) {
      console.error("Erro ao enviar email:", emailError);
      // Fallback: mostrar informações no console
      console.log("=== FALLBACK - INFORMAÇÕES DO EMAIL ===");
      console.log("Para:", email);
      console.log("Link de reset:", resetLink);
      console.log("Token:", resetToken);
      console.log("=== USE O TOKEN ACIMA PARA TESTAR ===");
    }

    res.status(200).json({
      message:
        "Se o email existir, você receberá instruções para redefinir sua senha",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Erro ao enviar email de reset:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// Rota para redefinir senha (igual ao SendGrid)
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
